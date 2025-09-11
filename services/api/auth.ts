import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-root-toast';

/**
 * Create standardized authentication headers for API requests
 * Ensures consistent authentication across platforms matching the web application's format
 */
export const createAuthHeaders = async () => {
  const storedToken = await SecureStore.getItemAsync('userToken');
  if (!storedToken) throw new Error('No authentication token available');

  return {
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    Cookie: `token=${storedToken}`,
    referer: `${process.env.EXPO_PUBLIC_BASE_URL}/Leads/Marketing`,
    origin: `${process.env.EXPO_PUBLIC_BASE_URL}`,
    'user-agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) MilesClient-Mobile/1.0.0',
    'x-requested-with': 'XMLHttpRequest',
  };
};

/**
 * Refresh the authentication token
 */
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.token) {
        // Store new access token
        await SecureStore.setItemAsync('userToken', result.token);
        
        // Store new refresh token if provided
        if (result.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', result.refreshToken);
        }
        
        return result.token;
      }
    }
    
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * Clear all authentication data and force logout
 */
export const clearAuthData = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('userToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

/**
 * Validate token and attempt refresh if needed
 * @returns Promise<boolean> - true if token is valid or refreshed, false if authentication failed
 */
export const validateAuthToken = async (): Promise<boolean> => {
  try {
    const storedToken = await SecureStore.getItemAsync('userToken');
    if (!storedToken) {
      return false;
    }

    // Check if current token is valid
    const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiry = tokenPayload.exp;
    const timeUntilExpiry = tokenExpiry - currentTime;

    // If token expires within 5 minutes, try to refresh it
    if (timeUntilExpiry < 300) {
      const newToken = await refreshAuthToken();
      
      if (newToken) {
        return true; // Successfully refreshed
      } else {
        // Refresh failed, clear auth data
        await clearAuthData();
        Toast.show('Session expired. Please login again.', {
          duration: Toast.durations.LONG,
        });
        return false;
      }
    }

    // Token is still valid
    if (currentTime < tokenExpiry) {
      return true;
    }

    // Token is expired, try to refresh
    const newToken = await refreshAuthToken();
    
    if (newToken) {
      return true; // Successfully refreshed
    } else {
      // Refresh failed, clear auth data
      await clearAuthData();
      Toast.show('Session expired. Please login again.', {
        duration: Toast.durations.LONG,
      });
      return false;
    }
    
  } catch (tokenError) {
    console.error(tokenError);
    await clearAuthData();
    Toast.show('Invalid session. Please login again.', {
      duration: Toast.durations.LONG,
    });
    return false;
  }
};
