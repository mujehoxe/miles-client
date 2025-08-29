import LoginPage from "@/components/LoginPage";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useEffect, useState } from "react";
import { RootSiblingParent } from "react-native-root-siblings";
import "../global.css";

export const UserContext = createContext<any | null>(null);

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("userToken");
        
        if (storedToken) {
          try {
            const decodedToken = jwtDecode(storedToken);
            setToken(storedToken);
            setUser(decodedToken);
          } catch (tokenError) {
            console.error('Failed to decode stored token:', tokenError);
            // Remove invalid token
            await SecureStore.deleteItemAsync("userToken");
          }
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
      
      setLoaded(true);
    };
    initializeApp();
  }, []);

  const handleLoginSuccess = async (newToken: string) => {
    try {
      // Decode token first to validate it
      const decodedToken = jwtDecode(newToken) as { id: string; exp?: number };
      
      // Store token
      await SecureStore.setItemAsync("userToken", newToken);
      
      // Update app state
      setToken(newToken);
      setUser(decodedToken);
    } catch (error) {
      console.error('Failed to process login success:', error);
      throw error; // Re-throw so the login component can handle it
    }
  };

  if (!token && loaded) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <RootSiblingParent>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <UserContext.Provider value={user}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </UserContext.Provider>
    </RootSiblingParent>
  );
}
