import React, { useContext, useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton, // Import IonButton for the logout button
} from "@ionic/react";
import { add } from "ionicons/icons";
import axios from "axios";
import { Book, getLogger, urlAPI } from "../core";
import { WebSocketContext } from "../core/WebSocket";
import { NetworkStatusContext } from "../core/NetworkStatusProvider";
import { AuthContext } from "../auth/authProvider";

const Home: React.FC<RouteComponentProps> = ({ history }) => {
  const log = getLogger("Home");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMoreBooks, setHasMoreBooks] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  const {logout} = useContext(AuthContext);
  const webSocket = useContext(WebSocketContext);
  const isOnline = useContext(NetworkStatusContext);

  const fetchBooks = async (page: number, query: string = "") => {
    try {
      const token = localStorage.getItem("token") || "";
      const response = await axios.get<Book[]>(`${urlAPI}/books`, {
        headers: { authorization: token },
        params: { page: page, limit: 10, title: query },
      });

      if (response.data.length > 0) {
        setBooks((prevBooks) => [...prevBooks, ...response.data]);
      }

      setHasMoreBooks(response.data.length === 10);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setToastMessage(error.response?.data.message || error.message);
        setShowToast(true);
        log(error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks(page, searchText);
  }, [page, searchText]);

  useEffect(() => {
    if (!webSocket) return;

    webSocket.onmessage = (event) => {
      const updatedData = JSON.parse(event.data);
      log("Message received:", updatedData);

      if (updatedData.event === "created") {
        setBooks((prevBooks) => [...prevBooks, updatedData.payload]);
      }

      if (updatedData.event === "updated") {
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === updatedData.payload.id ? updatedData.payload : book
          )
        );
      }
    };

    webSocket.onclose = () => {
      log("WebSocket closed");
    };

    webSocket.onerror = (error) => {
      log("WebSocket error:", error);
    };

    return () => {
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.close();
      }
    };
  }, [webSocket]);

  const loadMoreBooks = (event: InfiniteScrollCustomEvent) => {
    setPage((prevPage) => prevPage + 1);
    event.target.complete();
  };

  const navigateToBookDetails = (id: number) => {
    history.push(`/book/${id}`);
  };

  const navigateToAddBook = () => {
    history.push("/addbook");
  };

  
  const handleLogout = () => {
    logout?.();
    localStorage.removeItem("token");
    localStorage.clear();
    setBooks([]);
    history.push("/login");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" onClick={handleLogout}>
            Logout
          </IonButton>
          <IonTitle>Books</IonTitle>
        </IonToolbar>
        <IonText className={`status_text ${!isOnline ? "offline" : ""}`}>
          {isOnline ? "Online" : "Offline"}
        </IonText>
      </IonHeader>

      <IonContent fullscreen>
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => {
            setSearchText(e.detail.value!);
            setPage(1);
            setBooks([]);
          }}
          debounce={300}
          placeholder="Search for books"
        />

        <IonList>
          {books.map((book) => (
            <IonItem key={book.id} button onClick={() => navigateToBookDetails(book.id)}>
              <IonLabel>
                <h2>{book.title}</h2>
                <span>by {book.author}</span>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        <IonInfiniteScroll onIonInfinite={loadMoreBooks} threshold="100px" disabled={!hasMoreBooks}>
          <IonInfiniteScrollContent loadingText="Loading more books..."></IonInfiniteScrollContent>
        </IonInfiniteScroll>

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={navigateToAddBook}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
