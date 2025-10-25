import { createAuthHeaders, validateAuthToken } from './auth';

/**
 * Get all users/agents for assignee selection
 * @returns Promise<User[]> - Array of users
 */
export const getUsers = async () => {
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL?.replace(/\/$/, "")}/api/Users/get`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to fetch users: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    throw error;
  }
};
