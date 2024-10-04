import LoginPage from "@/components/LoginPage";
import { Slot } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useEffect, useState } from "react";

export const UserContext = createContext<any | null>(null);

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      const storedToken = await SecureStore.getItemAsync("userToken");
      if (storedToken) {
        setToken(storedToken);
        const decodedToken = jwtDecode(storedToken);
        setUser(decodedToken);
      }
      setLoaded(true);
    };
    initializeApp();
  }, []);

  const handleLoginSuccess = async (newToken: string) => {
    setToken(newToken);
    await SecureStore.setItemAsync("userToken", newToken);
    const decodedToken = jwtDecode(newToken) as { id: string };
    setUser(decodedToken);
  };

  if (!token && loaded)
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;

  return (
    <UserContext.Provider value={user}>
      <Slot />
    </UserContext.Provider>
  );
}
