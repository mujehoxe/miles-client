import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Toast from "react-native-root-toast";

/**
 * Create standardized authentication headers for API requests
 * Ensures consistent authentication across platforms matching the web application's format
 */
export const createAuthHeaders = async () => {
  const storedToken = await SecureStore.getItemAsync("userToken");
  if (!storedToken) throw new Error("No authentication token available");

  // Validate JWT format
  const tokenParts = storedToken.split(".");

  const headers = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    Authorization: `Bearer ${storedToken}`,
    Cookie: `token=${storedToken}`,
    "X-Requested-With": "XMLHttpRequest",
    // iOS device-specific headers
    token: storedToken,
    "x-auth-token": storedToken,
  };

  return headers;
};

/**
 * Refresh the authentication token
 */
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL?.replace(/\/$/, "")}/api/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${refreshToken}`,
        },
      }
    );

    if (response.ok) {
      const result = await response.json();

      if (result.success && result.token) {
        // Store new access token
        await SecureStore.setItemAsync("userToken", result.token);

        // Store new refresh token if provided
        if (result.refreshToken) {
          await SecureStore.setItemAsync("refreshToken", result.refreshToken);
        }

        return result.token;
      }
    } else {
      const errorText = await response.text();
      console.error("Refresh token API error:", response.status, errorText);
    }

    return null;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};

/**
 * Clear all authentication data and force logout
 */
export const clearAuthData = async (): Promise<void> => {
  await SecureStore.deleteItemAsync("userToken");
  await SecureStore.deleteItemAsync("refreshToken");
  await SecureStore.deleteItemAsync("user_permissions");
};

/**
 * Perform server logout and clear all local authentication data
 * @returns Promise<boolean> - true if logout was successful
 */
export const logout = async (): Promise<boolean> => {
  try {
    // Try to notify the server about logout
    const storedToken = await SecureStore.getItemAsync("userToken");
    if (storedToken) {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL?.replace(/\/$/, "")}/api/auth/logout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedToken}`,
              Cookie: `token=${storedToken}`,
            },
          }
        );

        // Don't wait for server response, proceed with local cleanup
        console.log("Server logout response:", response.status);
      } catch (serverError) {
        // Server error shouldn't prevent local logout
        console.warn(
          "Server logout failed, proceeding with local logout:",
          serverError
        );
      }
    }

    // Always clear local data regardless of server response
    await clearAuthData();

    Toast.show("Logged out successfully", {
      duration: Toast.durations.SHORT,
    });

    return true;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, clear local data
    await clearAuthData();

    Toast.show("Logged out successfully", {
      duration: Toast.durations.SHORT,
    });

    return true;
  }
};

/**
 * Validate token and attempt refresh if needed
 * @returns Promise<boolean> - true if token is valid or refreshed, false if authentication failed
 */
export const validateAuthToken = async (): Promise<boolean> => {
  try {
    const storedToken = await SecureStore.getItemAsync("userToken");
    if (!storedToken) {
      return false;
    }

    // Check if current token is valid
    let tokenPayload: { exp?: number };
    try {
      tokenPayload = jwtDecode(storedToken) as { exp?: number };
    } catch (decodeError) {
      console.log("JWT decode failed, clearing token:", decodeError);
      await clearAuthData();
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiry = tokenPayload.exp;
    const timeUntilExpiry = tokenExpiry ? tokenExpiry - currentTime : -1;

    // If token expires within 5 minutes, try to refresh it
    if (timeUntilExpiry < 300) {
      const newToken = await refreshAuthToken();

      if (newToken) {
        return true; // Successfully refreshed
      } else {
        // Refresh failed, clear auth data
        await clearAuthData();
        Toast.show("Session expired. Please login again.", {
          duration: Toast.durations.LONG,
        });
        return false;
      }
    }

    // Token is still valid
    if (tokenExpiry && currentTime < tokenExpiry) {
      return true;
    }

    const newToken = await refreshAuthToken();

    if (newToken) {
      return true; // Successfully refreshed
    } else {
      // Refresh failed, clear auth data
      await clearAuthData();
      Toast.show("Session expired. Please login again.", {
        duration: Toast.durations.LONG,
      });
      return false;
    }
  } catch (tokenError) {
    console.error(tokenError);
    await clearAuthData();
    Toast.show("Invalid session. Please login again.", {
      duration: Toast.durations.LONG,
    });
    return false;
  }
};
