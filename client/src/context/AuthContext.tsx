import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../config/firebase";

type AuthContextProps = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: string;
  setLoading: (ready: string) => void;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState("page");

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => {
        setLoading("");
      }, 300);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
