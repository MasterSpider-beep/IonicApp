import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
  IonLoading,
} from "@ionic/react";
import { getLogger } from "../core";
import { RouteComponentProps } from "react-router";
import { AuthContext } from "../auth/authProvider";
import axios from "axios";

const log = getLogger("Login");

const Login: React.FC<RouteComponentProps> = ({ history }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const {
    isAuthenticated,
    isAuthenticating,
    login,
    authenticationError,
    checkToken,
  } = useContext(AuthContext);

  useEffect(() => {
    checkToken?.();
  }, []);

  const handleLogin = useCallback(() => {
    if (username === "" || password === "") {
      setToastMessage("Please enter your username and password");
      setShowToast(true);
    } else {
      log("handleLogin...");
      try {
        login?.(username, password);
        setUsername("");
        setPassword("");
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          log(error.name + error.message);
        } else {
          log(error);
        }
      }
    }
  }, [username, password]);

  useEffect(() => {
    if (authenticationError) {
      if (axios.isAxiosError(authenticationError)) {
        log(authenticationError.name + authenticationError.message);
        setToastMessage(authenticationError.response?.data.message || authenticationError.message);
        setShowToast(true);
      }
    }
    if (isAuthenticated) {
      history.push("/home");
    }
  }, [authenticationError, isAuthenticated]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel position="stacked">Username</IonLabel>
          <IonInput
            type="text"
            value={username}
            onIonChange={(e) => setUsername(e.detail.value!)}
            required
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
            required
          />
        </IonItem>

        <IonButton expand="block" onClick={handleLogin}>
          Login
        </IonButton>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />
        <IonLoading isOpen={isAuthenticating} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
