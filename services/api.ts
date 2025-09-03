import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-root-toast';

export interface FilterOptions {
  searchTerm: string;
  searchBoxFilters: string[];
  selectedAgents: string[];
  selectedStatuses: string[];
  selectedSources: string[];
  selectedTags: string[];
  dateRange: [Date | null, Date | null];
  dateFor: string;
}

export interface LeadRequestOptions {
  includeNonAssigned?: boolean;
  viewAllLeads?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface LeadsResponse {
  data: any[];
  totalLeads: number;
}

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  requiresReminder?: "yes" | "no" | "optional";
}

export interface TagsResponse {
  options: FilterOption[];
  hasMore: boolean;
  totalCount: number;
}

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
 * Add a new reminder
 * @param reminderData - The reminder data to submit
 * @returns Promise<any> - API response
 */
export const addReminder = async (reminderData: any) => {
  console.log('📝 Adding reminder:', { leadId: reminderData.Leadid, dateTime: reminderData.DateTime });
  
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
    console.log('✅ Reminder added successfully');
    return result;
  } catch (error) {
    console.error('❌ Error adding reminder:', error);
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
  console.log('📝 Updating reminder:', { reminderId, dateTime: reminderData.DateTime });
  
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
    console.log('✅ Reminder updated successfully');
    return result;
  } catch (error) {
    console.error('❌ Error updating reminder:', error);
    throw error;
  }
};

/**
 * Get reminders for a specific lead
 * @param leadId - The ID of the lead
 * @returns Promise<any[]> - Array of reminders
 */
export const getLeadReminders = async (leadId: string) => {
  console.log('📝 Fetching reminders for lead:', leadId);
  
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
    console.log('✅ Lead reminders fetched successfully:', result.data?.length || 0, 'reminders');
    return result.data || [];
  } catch (error) {
    console.error('❌ Error fetching lead reminders:', error);
    throw error;
  }
};

/**
 * Get all users/agents for assignee selection
 * @returns Promise<User[]> - Array of users
 */
export const getUsers = async () => {
  console.log('👥 Fetching users for assignee selection');
  
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/Users/get`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to fetch users: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Users fetched successfully:', result.data?.length || 0, 'users');
    return result.data || [];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

/**
 * Refresh the authentication token
 */
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      console.log('No refresh token available');
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
        
        console.log('✅ Token refreshed successfully');
        return result.token;
      }
    }
    
    console.log('❌ Token refresh failed');
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Clear all authentication data and force logout
 * @returns Promise<void>
 */
export const clearAuthData = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('userToken');
  await SecureStore.deleteItemAsync('refreshToken');
  console.log('✅ Authentication data cleared');
};

/**
 * Validate token and attempt refresh if needed
 * @returns Promise<boolean> - true if token is valid or refreshed, false if authentication failed
 */
export const validateAuthToken = async (): Promise<boolean> => {
  try {
    const storedToken = await SecureStore.getItemAsync('userToken');
    if (!storedToken) {
      console.log('No access token found');
      return false;
    }

    // Check if current token is valid
    const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiry = tokenPayload.exp;
    const timeUntilExpiry = tokenExpiry - currentTime;

    // If token expires within 5 minutes, try to refresh it
    if (timeUntilExpiry < 300) {
      console.log(`Token expires in ${timeUntilExpiry} seconds, attempting refresh...`);
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
    console.log('Token expired, attempting refresh...');
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
    console.error('Token validation error:', tokenError);
    await clearAuthData();
    Toast.show('Invalid session. Please login again.', {
      duration: Toast.durations.LONG,
    });
    return false;
  }
};

/**
 * Build request body for leads API call
 */
export const buildLeadsRequestBody = (
  user: any,
  filters: FilterOptions,
  searchText: string,
  pagination: PaginationParams,
  options: LeadRequestOptions = {}
) => {
  // Determine selected agents from filters
  let selectedAgents = [];
  let requestOptions = {};

  if (filters?.selectedAgents && filters.selectedAgents.length > 0) {
    selectedAgents = filters.selectedAgents;

    // Remove non-assigned from selected agents if it exists
    selectedAgents = filters.selectedAgents.filter(agent => agent !== 'non-assigned');
  } else if (user.role === 'superAdmin') {
    // For superAdmin with no explicit selection, let backend decide scope
    selectedAgents = [];
    requestOptions = { viewAllLeads: true };
  } else {
    selectedAgents = [user.id];
  }

  return {
    searchTerm: searchText.trim(),
    selectedAgents: selectedAgents,
    selectedStatuses: filters.selectedStatuses || [],
    selectedSources: filters.selectedSources || [],
    selectedTags: filters.selectedTags || [],
    date:
      filters.dateRange && (filters.dateRange[0] || filters.dateRange[1])
        ? filters.dateRange
            .filter((date) => date !== null)
            .map((date) => date!.toISOString())
        : [],
    dateFor: filters.dateFor || 'LeadIntroduction',
    searchBoxFilters: filters.searchBoxFilters || ['LeadInfo'],
    page: pagination.page + 1, // Convert 0-based to 1-based for API
    limit: pagination.limit.toString(),
    userid: user.id,
    ...requestOptions,
    ...options,
  };
};

/**
 * Fetch leads with pagination and filtering
 */
export const fetchLeads = async (
  user: any,
  filters: FilterOptions,
  searchText: string,
  pagination: PaginationParams,
  options: LeadRequestOptions = {}
): Promise<LeadsResponse> => {
  if (!user || !user.id) {
    throw new Error('User not available');
  }

  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }

  const headers = await createAuthHeaders();
  const requestBody = buildLeadsRequestBody(user, filters, searchText, pagination, options);

  console.log('📤 API Request Body:', {
    selectedAgents: requestBody.selectedAgents,
    selectedStatuses: requestBody.selectedStatuses,
    selectedSources: requestBody.selectedSources,
    selectedTags: requestBody.selectedTags,
    searchTerm: requestBody.searchTerm,
    dateRange: requestBody.date,
    page: requestBody.page,
    limit: requestBody.limit,
  });

  const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Lead/get`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API request failed with status ${response.status}:`, errorText);
    throw new Error(`Failed to fetch leads: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Processing API response:', {
    keys: Object.keys(data),
    totalLeads: data.totalLeads,
    dataLength: Array.isArray(data.data) ? data.data.length : 0,
  });

  return {
    data: Array.isArray(data.data) ? data.data : [],
    totalLeads: data.totalLeads || 0,
  };
};

/**
 * Fetch status options
 */
export const fetchStatusOptions = async (): Promise<FilterOption[]> => {
  try {
    const headers = await createAuthHeaders();
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Status/get`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.map((status: any) => ({
        value: status._id,
        label: status.Status,
        color: status.color,
        requiresReminder: status.requiresReminder,
      }));
    } else {
      console.error('Failed to fetch status options:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching status options:', error);
    return [];
  }
};

/**
 * Fetch source options
 */
export const fetchSourceOptions = async (): Promise<FilterOption[]> => {
  try {
    const headers = await createAuthHeaders();
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Source/get`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.map((source: any) => ({
        value: source._id,
        label: source.Source,
      }));
    } else {
      console.error('Failed to fetch source options:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching source options:', error);
    return [];
  }
};

/**
 * Fetch tag options with pagination support
 */
export const fetchTagOptions = async (
  page = 1,
  limit = 50,
  searchTerm = ''
): Promise<TagsResponse> => {
  try {
    const headers = await createAuthHeaders();
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(searchTerm && { search: searchTerm }),
    });

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/api/tags/get?${queryParams}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (response.ok) {
      const data = await response.json();
      const tagOpts = data.data.map((tag: any, index: number) => ({
        label: tag.Tag,
        value: tag.Tag + '::' + (page - 1) * limit + index, // Ensure unique values across pages
      }));

      return {
        options: tagOpts,
        hasMore: tagOpts.length === limit,
        totalCount: data.totalTags || data.total || tagOpts.length,
      };
    } else {
      console.error('Failed to fetch tag options:', response.status);
      return { options: [], hasMore: false, totalCount: 0 };
    }
  } catch (error) {
    console.error('Error fetching tag options:', error);
    return { options: [], hasMore: false, totalCount: 0 };
  }
};

/**
 * Transform agents data to tree structure like web app
 */
export const transformAgentsDataToTreeSelect = (data: any[]): any[] => {
  if (!data || !Array.isArray(data)) return [];

  return data.map((userData) => ({
    value: userData._id,
    title: userData.username,
    label: userData.username,
    role: userData.role || userData.Role, // Preserve role information
    email: userData.email,
    personalEmail: userData.personalemail,
    isVerified: userData.isVerified,
    children: userData.subordinates
      ? userData.subordinates.map((subordinate: any) => ({
          value: subordinate._id,
          title: subordinate.username,
          label: subordinate.username,
          role: subordinate.role || subordinate.Role, // Preserve role information
          email: subordinate.email,
          personalEmail: subordinate.personalemail,
          isVerified: subordinate.isVerified,
          children: subordinate.subordinates
            ? transformAgentsDataToTreeSelect([subordinate])[0].children
            : undefined,
        }))
      : undefined,
  }));
};

/**
 * Update a lead with new data
 */
export const updateLead = async (leadId: string, updates: any): Promise<any> => {
  if (!leadId) {
    throw new Error('Lead ID is required');
  }

  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }

  const headers = await createAuthHeaders();
  
  console.log('📤 Updating lead:', { leadId, updates });

  const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Lead/update/${leadId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Lead update failed with status ${response.status}:`, errorText);
    throw new Error(`Failed to update lead: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Lead updated successfully:', { leadId, data: data.data });
  
  return data.data;
};

/**
 * Fetch agents options with hierarchy
 */
export const fetchAgents = async (user: any): Promise<any[]> => {
  if (!user || !user.id) return [];

  try {
    const headers = await createAuthHeaders();
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/api/staff/get?preserveHierarchy=true`,
      {
        method: 'GET',
        headers,
      }
    );

    if (response.ok) {
      const data = await response.json();
      const treeData = transformAgentsDataToTreeSelect(data.data);

      return treeData;
    } else {
      console.error('Failed to fetch agents:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
};

/**
 * Fetch full lead details by ID including all related data
 */
export const fetchLeadById = async (leadId: string): Promise<any> => {
  if (!leadId) {
    throw new Error('Lead ID is required');
  }

  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }

  const headers = await createAuthHeaders();
  
  console.log('📤 Fetching lead details:', { leadId });

  const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Lead/${leadId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Fetch lead failed with status ${response.status}:`, errorText);
    throw new Error(`Failed to fetch lead: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Lead details fetched successfully:', { leadId });
  
  return data.data || data;
};

/**
 * Fetch comments for a specific lead
 */
export const fetchLeadComments = async (leadId: string): Promise<any[]> => {
  if (!leadId) {
    throw new Error('Lead ID is required');
  }

  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }

  const headers = await createAuthHeaders();
  
  console.log('📤 Fetching lead comments:', { leadId });

  const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/comment/get/${leadId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Fetch comments failed with status ${response.status}:`, errorText);
    throw new Error(`Failed to fetch comments: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Comments fetched successfully:', { leadId, count: data.data?.length || 0 });
  
  return data.data || [];
};

/**
 * Search developers using Algolia API
 */
export const searchDevelopers = async (query: string = ''): Promise<any[]> => {
  try {
    const response = await fetch(
      'https://ll8iz711cs-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%20(lite)&x-algolia-application-id=LL8IZ711CS&x-algolia-api-key=15cb8b0a2d2d435c6613111d860ecfc5',
      {
        method: 'POST',
        headers: {
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              indexName: 'bayut-production-agencies-en',
              params: `page=0&hitsPerPage=100&query=${encodeURIComponent(
                query
              )}&optionalWords=&facets=%5B%5D&maxValuesPerFacet=100&attributesToHighlight=%5B%22name%22%5D&attributesToRetrieve=%5B%22name%22%2C%22stats.adsCount%22%5D&filters=(type%3A%22developer%22)&numericFilters=stats.adsCount%3E%3D1`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Developer search failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Process and sort the results
    const developerOptions = data.results[0].hits
      .sort((a: any, b: any) => b.stats.adsCount - a.stats.adsCount)
      .slice(0, 20)
      .map((developer: any) => ({
        value: developer.name,
        label: developer.name,
        adsCount: developer.stats.adsCount,
      }));

    return developerOptions;
  } catch (error) {
    console.error('Error searching developers:', error);
    // Return empty array on error instead of throwing
    return [];
  }
};

/**
 * Add a comment to a lead
 */
export const addLeadComment = async (leadId: string, content: string): Promise<any> => {
  if (!leadId || !content?.trim()) {
    throw new Error('Lead ID and comment content are required');
  }

  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }

  const headers = await createAuthHeaders();
  
  console.log('📤 Adding lead comment:', { leadId, contentLength: content.length });

  const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/comment/add`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      leadData: { _id: leadId },
      content: content.trim(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Add comment failed with status ${response.status}:`, errorText);
    throw new Error(`Failed to add comment: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Comment added successfully:', { leadId });
  
  return data;
};

/**
 * Delete a comment
 */
export const deleteLeadComment = async (commentId: string): Promise<any> => {
  if (!commentId) {
    throw new Error('Comment ID is required');
  }

  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }

  const headers = await createAuthHeaders();
  
  console.log('📤 Deleting comment:', { commentId });

  const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/comment/delete/${commentId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Delete comment failed with status ${response.status}:`, errorText);
    throw new Error(`Failed to delete comment: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Comment deleted successfully:', { commentId });
  
  return data;
};

/**
 * Add a new meeting
 * @param meetingData - The meeting data to submit
 * @returns Promise<any> - API response
 */
export const addMeeting = async (meetingData: any) => {
  console.log('📝 Adding meeting:', { leadId: meetingData.Lead, subject: meetingData.Subject });
  
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/Meeting/add`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(meetingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to add meeting: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Meeting added successfully');
    return result;
  } catch (error) {
    console.error('❌ Error adding meeting:', error);
    throw error;
  }
};

/**
 * Update an existing meeting
 * @param meetingId - The ID of the meeting to update
 * @param meetingData - The updated meeting data
 * @returns Promise<any> - API response
 */
export const updateMeeting = async (meetingId: string, meetingData: any) => {
  console.log('📝 Updating meeting:', { meetingId, subject: meetingData.Subject });
  
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/Meeting/update/${meetingId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(meetingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to update meeting: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Meeting updated successfully');
    return result;
  } catch (error) {
    console.error('❌ Error updating meeting:', error);
    throw error;
  }
};

/**
 * Get meetings for a specific lead
 * @param leadId - The ID of the lead
 * @returns Promise<any[]> - Array of meetings
 */
export const getLeadMeetings = async (leadId: string) => {
  console.log('📝 API: Starting getLeadMeetings for leadId:', leadId);
  
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    const url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/Meeting/get/${leadId}`;
    
    console.log('📝 API: Making request to URL:', url);
    console.log('📝 API: Request headers:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    console.log('📝 API: Response status:', response.status);
    console.log('📝 API: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 API: Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      
      throw new Error(errorData.error || `Failed to fetch meetings: HTTP ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log('📝 API: Raw response text:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('📝 API: Failed to parse JSON response:', e);
      throw new Error('Invalid JSON response from server');
    }
    
    console.log('📝 API: Parsed response object:', {
      result,
      hasData: 'data' in result,
      dataType: typeof result.data,
      dataIsArray: Array.isArray(result.data),
      dataLength: Array.isArray(result.data) ? result.data.length : 'N/A'
    });
    
    const meetings = result.data || [];
    console.log('✅ API: Lead meetings fetched successfully:', {
      count: meetings.length,
      meetings: meetings.slice(0, 2) // Log first 2 meetings for inspection
    });
    
    return meetings;
  } catch (error) {
    console.error('❌ API: Error fetching lead meetings:', {
      error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};
