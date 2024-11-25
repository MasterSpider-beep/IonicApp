import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home";
import Login from "./pages/LogIn";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import BookDetails from "./pages/BookDetails";
import WebSocketProvider from "./core/WebSocket";
import NetworkStatusProvider from "./core/NetworkStatusProvider";
import { AuthContext, AuthProvider } from "./auth/authProvider";
import { useContext, useEffect } from "react";
import AddBook from "./pages/addBook";
import BookAPIProvider from "./core/BookAPIContext";
setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
        <NetworkStatusProvider>
        <WebSocketProvider>
          <IonReactRouter>
            <IonRouterOutlet>
              <Route path="/home" exact={true} component={Home} />
              <Route exact path="/">
                <Redirect to="/login" />
              </Route>
              <Route path="/login" exact={true} component={Login} />
              <BookAPIProvider>
                <Route path="/book/:id" exact component={BookDetails} />
                <Route path="/addbook" exact={true} component={AddBook} />
              </BookAPIProvider>
            </IonRouterOutlet>
          </IonReactRouter>
          </WebSocketProvider>
        </NetworkStatusProvider>
    </IonApp>
  );
};

export default App;
