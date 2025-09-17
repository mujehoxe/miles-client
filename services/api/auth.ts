import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-root-toast';
import { jwtDecode } from 'jwt-decode';

/**
 * Create standardized authentication headers for API requests
 * Ensures consistent authentication across platforms matching the web application's format
 */
export const createAuthHeaders = async () => {
  const storedToken = await SecureStore.getItemAsync('userToken');
  if (!storedToken) throw new Error('No authentication token available');

  // Validate JWT format
  const tokenParts = storedToken.split('.');
  const isValidJWTFormat = tokenParts.length === 3;
  
  console.log('[iOS Debug] Creating auth headers with token:', {
    tokenLength: storedToken.length,
    tokenStart: storedToken.substring(0, 20) + '...',
    tokenEnd: '...' + storedToken.substring(storedToken.length - 20),
    platform: require('react-native').Platform.OS,
    jwtParts: tokenParts.length,
    isValidJWTFormat,
    containsSpecialChars: /[^A-Za-z0-9._-]/.test(storedToken),
    fullToken: storedToken // Full token for debugging campaigns API issue
  });

  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${storedToken}`,
    'Cookie': `token=${storedToken}`,
    'X-Requested-With': 'XMLHttpRequest',
    // iOS device-specific headers
    'token': storedToken,
    'x-auth-token': storedToken,
  };

  console.log('[iOS Debug] Auth headers created:', {
    hasCookie: !!headers.Cookie,
    cookieLength: headers.Cookie?.length,
    cookieStart: headers.Cookie?.substring(0, 30) + '...',
    hasAuthorization: !!headers.Authorization,
    authorizationStart: headers.Authorization?.substring(0, 20) + '...',
  });

  return headers;
};

/**
 * Refresh the authentication token
 */
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      console.log('[iOS Debug] No refresh token found');
      return null;
    }

    console.log('[iOS Debug] Attempting token refresh');
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`,
      },
    });

    console.log('[iOS Debug] Refresh response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('[iOS Debug] Refresh result:', { success: result.success, hasToken: !!result.token });
      
      if (result.success && result.token) {
        // Store new access token
        await SecureStore.setItemAsync('userToken', result.token);
        
        // Store new refresh token if provided
        if (result.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', result.refreshToken);
        }
        
        console.log('[iOS Debug] Token refreshed successfully');
        return result.token;
      }
    } else {
      const errorText = await response.text();
      console.log('[iOS Debug] Refresh failed:', response.status, errorText);
    }
    
    return null;
  } catch (error) {
    console.error('[iOS Debug] Refresh token error:', error);
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
    let tokenPayload: { exp?: number };
    try {
      tokenPayload = jwtDecode(storedToken) as { exp?: number };
    } catch (decodeError) {
      console.log('[iOS Debug] JWT decode failed, clearing token:', decodeError);
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
        Toast.show('Session expired. Please login again.', {
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
