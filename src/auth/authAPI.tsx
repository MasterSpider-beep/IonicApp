import axios from "axios";
import { withLogs } from "../core";
import { urlAPI } from "../core";
export interface AuthProps {
  token: string;
}

export interface CheckProps {
  authenticated: boolean;
}

export const login: (
  username?: string,
  password?: string
) => Promise<AuthProps> = (username, password) => {
  return withLogs(
    axios.post(urlAPI + "/login", { username, password }),
    "login"
  );
};

export const checkToken: (token: string) => Promise<CheckProps> = (token) => {
  return withLogs(
    axios.post(urlAPI + "/checkToken", {}, {
      headers: { authorization: token },
    }),
    "checkToken"
  );
};

export const logout: (token: string) => Promise<void> = (token) => {
  return withLogs(
    axios.post(urlAPI + "/logout", {}, {
      headers: { authorization: token },
    }),
    "logout"
  );
}
