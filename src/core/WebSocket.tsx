import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useContext,
} from "react";
import { urlAPI, getLogger } from "../core";
import { AuthContext } from "../auth/authProvider";
import { NetworkStatusContext } from "./NetworkStatusProvider";

export const WebSocketContext = createContext<WebSocket | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const log = getLogger("WebSocketProvider");
  const { isAuthenticated, token } = useContext(AuthContext);
  const {isOnline} = useContext(NetworkStatusContext);

  useEffect(() => {
    if(isOnline === false){
      if(webSocket !== null){
        webSocket.close();
        setWebSocket(null);
      }
      return;
    }
    if (isAuthenticated === false) {
      if(webSocket !== null){
        webSocket.close();
        setWebSocket(null);
      }
      return;
    }  
    if(webSocket !== null){
      return;
    }
    const ws = new WebSocket(urlAPI);
    setWebSocket(ws);

    ws.onopen = () => {
      log("WebSocket connected");
      ws.send(JSON.stringify({ type: "authenticate", token }));
    };
    ws.onclose = () => log("WebSocket disconnected");
    ws.onerror = (error) => log("WebSocket error:", error);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isAuthenticated, isOnline]);

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
