import {
    IonButton,
    IonCheckbox,
    IonCol,
    IonContent,
    IonDatetime,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonRow,
    IonText,
    IonTitle,
    IonToast,
    IonToolbar,
} from "@ionic/react";
import {useContext, useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {NetworkStatusContext} from "../core/NetworkStatusProvider";
import "./common.css";
import {getLogger} from "../core";
import "./addBook.css";
import {BookAPIContext} from "../core/BookAPIContext";
import {Book} from "../core";

const log = getLogger("AddBook");

const AddBook: React.FC<RouteComponentProps> = ({history}) => {
    const isOnline = useContext(NetworkStatusContext);
    const [title, setTitle] = useState<string>("");
    const [author, setAuthor] = useState<string>("");
    const [releaseDate, setReleaseDate] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);
    const [isRentable, setIsRentable] = useState<boolean>(false);
    const {addBook, bookAdded} = useContext(BookAPIContext);
    const [message, setMessage] = useState<string>("");
    const [showToast, setShowToast] = useState<boolean>(false);

    const handleSubmit = () => {
        log("handleSubmit...");
        if (author === "" || title === "" || releaseDate === "") {
            setMessage("Please fill all the fields");
            setShowToast(true);
            return;
        }
        const book = {id:0, title, author, releaseDate, quantity, isRentable, image: "", location: ""};
        if(addBook) {
            addBook(book);
        }
    };

    useEffect(() => {
        if (bookAdded !== null) {
            if (bookAdded) {
                setMessage("Book added successfully");
                setShowToast(true);
            } else {
                setMessage("Failed to add book, saving and retrying when online");
                setShowToast(true);
            }
        }
    }, [bookAdded]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Add a new book</IonTitle>
                </IonToolbar>
                <IonText className={`status_text ${!isOnline ? "offline" : ""}`}>
                    {isOnline ? "Online" : "Offline"}
                </IonText>
            </IonHeader>

            <IonContent fullscreen>
                <form>
                    <IonRow class="firstElem">
                        {/* Title Input */}
                        <IonCol>
                            <IonLabel position="floating">Title</IonLabel>
                            <IonInput
                                type="text"
                                value={title}
                                onIonChange={(e) => setTitle(e.detail.value!)}
                                required
                            />
                        </IonCol>

                        {/* Author Input */}
                        <IonCol>
                            <IonLabel position="floating">Author</IonLabel>
                            <IonInput
                                type="text"
                                value={author}
                                onIonChange={(e) => setAuthor(e.detail.value!)}
                                required
                            />
                        </IonCol>
                    </IonRow>

                    {/* Release Date Input */}
                    <IonItem>
                        <IonLabel position="floating" className="label">
                            Release Date
                        </IonLabel>
                        <IonDatetime
                            value={releaseDate}
                            aria-required="true"
                            presentation="date"
                            onIonChange={(e) => {
                                const selectedDate = e.detail.value
                                    ? new Date(e.detail.value as string)
                                    : null;
                                if (selectedDate) {
                                    const formattedDate = selectedDate
                                        .toISOString()
                                        .split("T")[0];
                                    setReleaseDate(formattedDate);
                                }
                            }}
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel position="floating" className={"label"}>
                            Quantity
                        </IonLabel>
                        <IonInput
                            type="number"
                            value={quantity}
                            onIonChange={(e) => setQuantity(parseInt(e.detail.value!, 10))}
                            min={1}
                            required
                        />
                    </IonItem>

                    <IonItem
                        lines="none"
                        style={{display: "flex", alignContent: "center", gap: "8px"}}
                    >
                        <IonLabel>Is Rentable</IonLabel>
                        <IonCheckbox
                            checked={isRentable}
                            onIonChange={(e) => setIsRentable(e.detail.checked)}
                        />
                    </IonItem>

                    {/* Submit Button */}
                    <IonButton expand="full" onClick={handleSubmit}>
                        Submit
                    </IonButton>
                </form>
            </IonContent>
            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={message}
                duration={2000}
            />
        </IonPage>
    );
};

export default AddBook;
