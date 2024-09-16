import React, { createContext, useEffect, useState } from "react";
import { Slot } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import LoginPage from "@/components/LoginPage";

export const DeviceContext = createContext<string | null>(null);

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      const storedToken = await SecureStore.getItemAsync("userToken");
      if (storedToken) {
        setToken(storedToken);
        const decodedToken = jwtDecode(storedToken) as { id: string };
        setDeviceId(decodedToken.id);
      }
      setLoaded(true);
    };
    initializeApp();
  }, []);

  const handleLoginSuccess = async (newToken: string) => {
    setToken(newToken);
    await SecureStore.setItemAsync("userToken", newToken);
    const decodedToken = jwtDecode(newToken) as { id: string };
    setDeviceId(decodedToken.id);
  };

  if (!token && loaded) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DeviceContext.Provider value={deviceId}>
      <Slot />
    </DeviceContext.Provider>
  );
}
