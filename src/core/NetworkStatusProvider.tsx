import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import {Book} from "./index";
import {AuthState} from "../auth/authProvider";

interface NetworkStatus {
  isOnline: boolean;
}

const initialState: NetworkStatus = {isOnline:false}

export const NetworkStatusContext = createContext<NetworkStatus>(initialState);

export const NetworkStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkInitialNetworkStatus = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkInitialNetworkStatus();

    Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
    });

    return () => {
        Network.removeAllListeners();
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{isOnline}}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export default NetworkStatusProvider;
