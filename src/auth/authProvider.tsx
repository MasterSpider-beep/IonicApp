import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { getLogger } from "../core";
import { login as loginApi, checkToken as checkTokenApi, logout as logoutApi } from "./authAPI";
import { AxiosError } from "axios";

const log = getLogger('AuthProvider');

type LoginFn = (username?: string, password?: string) => void;
type CheckTokenFn = () => void;

export interface AuthState {
  authenticationError: Error | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login?: LoginFn;
  checkToken?: CheckTokenFn;
  pendingAuthentication?: boolean;
  username?: string;
  password?: string;
  token: string;
  logout?: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isAuthenticating: false,
  authenticationError: null,
  pendingAuthentication: false,
  token: '',
};

export const AuthContext = React.createContext<AuthState>(initialState);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) =>{
    const [state, setState] = useState<AuthState>(initialState);
    const { isAuthenticated, isAuthenticating, authenticationError, pendingAuthentication, token } = state;
    const login = useCallback<LoginFn>(loginCallback, []);
    const logout = useCallback(logoutCallBack, []);
    const checkToken = useCallback<CheckTokenFn>(checkTokenCallback, []);
    useEffect(authenticationEffect, [pendingAuthentication]);
    const value = { isAuthenticated, login, checkToken, isAuthenticating, authenticationError, token, logout};
    log('render');
    
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );

    function logoutCallBack(): void {
      log('logout');
      const token = localStorage.getItem('token') || '';
      logoutApi(token);
      localStorage.removeItem('token');
      setState({
        ...state,
        isAuthenticated: false,
        token: '',
      });
    }
    
    async function checkTokenCallback(): Promise<void> {
      log('checkToken');
      const token = localStorage.getItem('token');
      if(!token){
        return;
      }
      const authenticated = await checkTokenApi(token);
      if(authenticated){
        setState({
          ...state,
          token,
          isAuthenticated: true,
        });
      }
    };

    function loginCallback(username?: string, password?: string): void {
      log('login');
      setState({
        ...state,
        pendingAuthentication: true,
        username,
        password
      });
    }
  
    function authenticationEffect() {
      let canceled = false;
      authenticate();
      return () => {
        canceled = true;
      }
  
      async function authenticate() {
        if (!pendingAuthentication) {
          log('authenticate, !pendingAuthentication, return');
          return;
        }
        try {
          log('authenticate...');
          setState({
            ...state,
            isAuthenticating: true,
          });
          const { username, password } = state;
          const { token } = await loginApi(username, password);
          if (canceled) {
            return;
          }
          log('authenticate succeeded');
          setState({
            ...state,
            token:token,
            pendingAuthentication: false,
            isAuthenticated: true,
            isAuthenticating: false,
          });
          localStorage.setItem('token', token);
        } catch (error) {
          log('authenticate failed');
          setState({
            ...state,
            authenticationError: error as AxiosError,
            pendingAuthentication: false,
            isAuthenticating: false,
          });
        }
      }
    }
};