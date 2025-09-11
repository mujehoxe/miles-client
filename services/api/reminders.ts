import { createAuthHeaders, validateAuthToken } from './auth';

/**
 * Add a new reminder
 * @param reminderData - The reminder data to submit
 * @returns Promise<any> - API response
 */
export const addReminder = async (reminderData: any) => {
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/Reminder/add`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(reminderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to add reminder: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing reminder
 * @param reminderId - The ID of the reminder to update
 * @param reminderData - The updated reminder data
 * @returns Promise<any> - API response
 */
export const updateReminder = async (reminderId: string, reminderData: any) => {
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/Reminder/update/${reminderId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(reminderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to update reminder: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get reminders for a specific lead
 * @param leadId - The ID of the lead
 * @returns Promise<any[]> - Array of reminders
 */
export const getLeadReminders = async (leadId: string) => {
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/Reminder/get/${leadId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to fetch reminders: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    throw error;
  }
};
