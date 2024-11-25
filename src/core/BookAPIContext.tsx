import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { NetworkStatusContext } from "./NetworkStatusProvider";
import { Book, getLogger, urlAPI } from "./index";
import axios, { isAxiosError } from "axios";

interface BookContextType {
  addBook?: (book: Book) => Promise<void>;
  editBook?: (book: Book) => Promise<void>;
  bookAdded: boolean | null;
  bookEdited: boolean | null;
}

const initState:BookContextType ={
  bookAdded: null,
  bookEdited: null
}

interface OfflineBookEntry {
  book: Book;
  operation: "add" | "edit";
}

export const BookAPIContext = createContext<BookContextType>(initState);

const log = getLogger("BookAPIProvider");
const OFFLINE_BOOKS_KEY = "offlineBooks";

export const BookAPIProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [bookAdded, setBookAdded] = useState<boolean | null>(null);
  const [bookEdited, setBookEdited] = useState<boolean | null>(null);

  const storeBookOffline = (book: Book, operation: "add" | "edit") => {
    const offlineBooks = getOfflineBooks();
    offlineBooks.push({ book, operation });
    localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(offlineBooks));
  };

  const getOfflineBooks = (): OfflineBookEntry[] => {
    const offlineBooks = localStorage.getItem(OFFLINE_BOOKS_KEY);
    return offlineBooks ? JSON.parse(offlineBooks) : [];
  };

  const addBookOnline = async (book: Book) => {
    try {
      const token = localStorage.getItem("token") || "";
      await axios.post(urlAPI + "/books", book, {
        headers: { authorization: token },
      });
      log("Book added successfully online");
      setBookAdded(true);
    } catch (error) {
      log("Failed to add book online, storing offline", error);
      storeBookOffline(book, "add");
      setBookAdded(false);
    }
  };

  const retryAddOfflineBooks = async () => {
    const offlineBooks = getOfflineBooks();
    const remainingEntries: OfflineBookEntry[] = [];
    const token = localStorage.getItem("token") || "";
    for (const entry of offlineBooks) {
      const { book, operation } = entry;
      try {
        if (operation === "add") {
          // Try adding the book
          await axios.post(urlAPI + "/books", book, {
            headers: { authorization: token },
          });
          log("Successfully retried add operation for book:", book);
        } else if (operation === "edit") {
          await axios.put(urlAPI + `/books`, book, {
            headers: { authorization: token },
          });
          log("Successfully retried edit operation for book:", book);
        }
      } catch (error) {
        log("Retry failed, keeping offline:", entry, error);
        remainingEntries.push(entry);
      }
    }

    localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(remainingEntries));
  };

  const isOnline = useContext(NetworkStatusContext);

  const addBook = async (book: Book) => {
    addBookOnline(book);
  };

  const editBookOnline = async (book: Book) => {
    try {
      const token = localStorage.getItem("token") || "";
      await axios.put(urlAPI + "/books", book, {
        headers: { authorization: token },
      });
      log("Book edited successfully online");
      setBookEdited(true);
    } catch (error) {
      log("Failed to edit book online, storing offline", error);
      storeBookOffline(book, "edit");
      setBookEdited(false);
    }
  };

  const editBook = async (book: Book) => {
    editBookOnline(book);
  };

  useEffect(() => {
    if (isOnline) {
      retryAddOfflineBooks();
    }
  }, [isOnline]);

  return (
    <BookAPIContext.Provider value={{ addBook, bookAdded, editBook, bookEdited }}>
      {children}
    </BookAPIContext.Provider>
  );
};

export default BookAPIProvider;
