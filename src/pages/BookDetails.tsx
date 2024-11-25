import React, { useContext, useEffect, useState, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonToast,
} from "@ionic/react";
import { pencil } from "ionicons/icons";
import { RouteComponentProps } from "react-router";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Book, getLogger, urlAPI } from "../core";
import { WebSocketContext } from "../core/WebSocket";
import { NetworkStatusContext } from "../core/NetworkStatusProvider";
import { BookAPIContext } from "../core/BookAPIContext";
import { Camera, CameraResultType } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import "./common.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const log = getLogger("BookDetails");

const BookDetails: React.FC<RouteComponentProps> = ({ history }) => {
  const { id } = useParams<{ id: string }>();
  const realId = parseInt(id);
  const [book, setBook] = useState<Book | null>(null);
  const webSocket = useContext(WebSocketContext);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedBook, setEditedBook] = useState<Book | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const isOnline = useContext(NetworkStatusContext);
  const { editBook, bookEdited } = useContext(BookAPIContext);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const response = await axios.get<Book>(urlAPI + "/books/" + realId, {
          headers: { authorization: token },
        });
        setBook(response.data);
        setEditedBook(response.data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          log(error);
          setErrorMessage(error.response?.data.message || error.message);
        }
      }
    };
    fetchBook();
  }, []);

  useEffect(() => {
    if (!webSocket) return;
    webSocket.onmessage = (event) => {
      const updatedData = JSON.parse(event.data);
      log("Message received:", updatedData);

      if (updatedData.event === "updated") {
        if (realId === updatedData.payload.id) {
          setBook(updatedData.payload);
        }
      }
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

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleInputChange = (field: keyof Book, value: any) => {
    setEditedBook({ ...editedBook!, [field]: value });
  };

  const handleSubmit = () => {
    if (editBook && editedBook) {
      editBook(editedBook);
      setShowEditModal(false);
    }
  };

  useEffect(() => {
    if (bookEdited === null) {
      return;
    }
    if (bookEdited === true) {
      setToastMessage("Book edited successfully");
      setShowToast(true);
    } else {
      setToastMessage("Failed to edit book, saving and retrying again online");
      setShowToast(true);
    }
  }, [bookEdited]);

  const handleImagePick = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        resultType: CameraResultType.Base64,
      });
      console.log("Image:", image);
      if (image.base64String) {
        handleInputChange("image", image.base64String);
      }
    } catch (error) {
      console.error("Error selecting image:", error);
    }
  };

  const renderMap = () => {
    if (book !== null && book.lat !== null && book.long !== null) {
      return (
        <div style={{ margin: "15px", height: "300px", width: "300px" }}>
          <h3>Location</h3>
          <MapContainer
            center={[book.lat, book.long]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[book.lat, book.long]}>
              <Popup>{book.title}</Popup>
            </Marker>
          </MapContainer>
        </div>
      );
    }
    return null;
  };

  const renderEditMap = () => {
    const MapClickHandler = () => {
      useMapEvents({
        click: (e) => {
          const { lat, lng } = e.latlng; // Extract latitude and longitude
          setEditedBook({
            ...editedBook!,
            lat: lat,
            long: lng,
          }); // Update both lat and long in the state
        },
      });
  
      return null;
    };

  
    return (
      <MapContainer
        center={[editedBook?.lat || 0, editedBook?.long || 0]}
        zoom={15}
        style={{ height: "300px", width: "300px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        {editedBook?.lat && editedBook?.long && (
          <Marker position={[editedBook.lat, editedBook.long]}>
            <Popup>Selected Location</Popup>
          </Marker>
        )}
      </MapContainer>
    );
  };

  if (errorMessage)
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Book Details</IonTitle>
          </IonToolbar>
          <IonText className={`status_text ${!isOnline ? "offline" : ""}`}>
            {isOnline ? "Online" : "Offline"}
          </IonText>
        </IonHeader>
        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Error</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>{errorMessage}</p>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );

  if (book)
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Book Details</IonTitle>
          </IonToolbar>
          <IonText className={`status_text ${!isOnline ? "offline" : ""}`}>
            {isOnline ? "Online" : "Offline"}
          </IonText>
        </IonHeader>
        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{book.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Author: {book.author}</p>
              <p>
                Release Date: {new Date(book.releaseDate).toLocaleDateString()}
              </p>
              <p>Quantity: {book.quantity}</p>
              <p>Rentable: {book.isRentable ? "Yes" : "No"}</p>
              <p>Book image: </p>
              {book?.image ? (
                <img
                  src={`data:image/jpeg;base64,${book.image}`}
                  alt="Book Preview"
                  style={{
                    width: "200px",
                    height: "auto",
                    marginTop: "10px",
                  }}
                />
              ) : (
                <IonText>No image uploaded</IonText>
              )}
            </IonCardContent>
          </IonCard>

          {renderMap()}

          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleEditClick}>
              <IonIcon icon={pencil} />
            </IonFabButton>
          </IonFab>

          <IonModal
            isOpen={showEditModal}
            onDidDismiss={() => setShowEditModal(false)}
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Edit Book</IonTitle>
                <IonButton slot="end" onClick={() => setShowEditModal(false)}>
                  Close
                </IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonItem>
                <IonLabel position="stacked">Title</IonLabel>
                <IonInput
                  value={editedBook?.title || ""}
                  onIonChange={(e) =>
                    handleInputChange("title", e.detail.value)
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Author</IonLabel>
                <IonInput
                  value={editedBook?.author || ""}
                  onIonChange={(e) =>
                    handleInputChange("author", e.detail.value)
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Quantity</IonLabel>
                <IonInput
                  type="number"
                  value={editedBook?.quantity || ""}
                  onIonChange={(e) =>
                    handleInputChange("quantity", parseInt(e.detail.value!))
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Release Date</IonLabel>
                <IonInput
                  type="date"
                  value={
                    editedBook
                      ? new Date(editedBook.releaseDate)
                          .toISOString()
                          .slice(0, 10)
                      : ""
                  }
                  onIonChange={(e) =>
                    handleInputChange("releaseDate", e.detail.value)
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel>Rentable</IonLabel>
                <IonCheckbox
                  checked={editedBook?.isRentable || false}
                  onIonChange={(e) =>
                    handleInputChange("isRentable", e.detail.checked)
                  }
                />
              </IonItem>
              <IonButton expand="block" onClick={handleImagePick}>
                Select Image
              </IonButton>
              <div style={{ margin: "15px 0" }}>{renderEditMap()}</div>
              <IonButton expand="block" onClick={handleSubmit}>
                Save Changes
              </IonButton>
            </IonContent>
          </IonModal>
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
          />
        </IonContent>
      </IonPage>
    );
};

export default BookDetails;
