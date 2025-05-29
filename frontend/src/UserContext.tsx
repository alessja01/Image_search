import React, { createContext, useState, useContext, ReactNode } from "react";

// Tipi dell'utente e del contesto
interface User {
  username: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

// Crea il contesto
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Carica l'utente e il token dal localStorage (se esistono)
  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("jwtToken");

    if (storedUser && storedUser !== "undefined" && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (e) {
        console.error("Errore parsing user:", e);
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  }, []);
  
  return (
    <UserContext.Provider value={{ user, token, setUser, setToken }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook per usare il contesto
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
