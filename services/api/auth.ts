import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Toast from "react-native-root-toast";
import { unsubscribeFromOneSignal } from "../../utils/oneSignalUtils";

/**
 * Create standardized authentication headers for API requests
 * Ensures consistent authentication across platforms matching the web application's format
 */
export const createAuthHeaders = async () => {
  const storedToken = await SecureStore.getItemAsync("userToken");
  if (!storedToken) throw new Error("No authentication token available");

  // Validate JWT format before using it
  const tokenParts = storedToken.split(".");
  if (tokenParts.length !== 3) {
    console.log("JWT malformed - clearing invalid token");
    await clearAuthData();
    throw new Error("Invalid token format - JWT must have 3 parts");
  }

  // Try to decode the token to ensure it's valid
  try {
    jwtDecode(storedToken);
  } catch (decodeError) {
    console.log("JWT decode failed in createAuthHeaders, clearing token:", decodeError);
    await clearAuthData();
    throw new Error("Invalid token - decode failed");
  }

  const headers = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    Authorization: `Bearer ${storedToken}`,
    "X-Requested-With": "XMLHttpRequest",
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

    // Unsubscribe from OneSignal before clearing auth data
    await unsubscribeFromOneSignal();

    // Always clear local data regardless of server response
    await clearAuthData();

    Toast.show("Logged out successfully", {
      duration: Toast.durations.SHORT,
    });

    return true;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, unsubscribe from OneSignal and clear local data
    await unsubscribeFromOneSignal();
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

/**
 * Emergency token cleanup - call this if you suspect token corruption
 */
export const emergencyTokenCleanup = async (): Promise<void> => {
  try {
    console.log('🚨 Emergency token cleanup initiated');
    
    // Clear all authentication data
    await clearAuthData();
    
    // Clear any other potential token storage
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('auth_token');
    
    console.log('✅ Emergency cleanup completed');
    return;
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error);
  }
};

/**
 * Diagnostic function to check token health
 */
export const diagnoseToken = async (): Promise<string> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      return '❌ No token found in SecureStore';
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return `❌ JWT malformed - has ${parts.length} parts instead of 3`;
    }
    
    try {
      const decoded = jwtDecode(token) as { exp?: number };
      const now = Math.floor(Date.now() / 1000);
      const exp = decoded.exp || 0;
      
      if (exp < now) {
        return '❌ Token is expired';
      } else if ((exp - now) < 300) {
        return '⚠️ Token expires within 5 minutes';
      } else {
        return '✅ Token appears healthy';
      }
    } catch (decodeError) {
      return `❌ JWT decode failed: ${(decodeError as Error).message}`;
    }
  } catch (error) {
    return `❌ Diagnostic failed: ${(error as Error).message}`;
  }
};



