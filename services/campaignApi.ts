import { createAuthHeaders, validateAuthToken } from './api';

export interface CampaignFilters {
  campaignName: string;
  page?: number;
  limit?: number;
}

export interface CampaignLeadsResponse {
  message: string;
  data: any[];
  totalLeads: number;
}

export interface CampaignsWithCountsResponse {
  data: Array<{ 
    _id: string; 
    Tag: string; 
    leadCount: number; 
    pendingLeadsCount?: number 
  }>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Fetch leads for a specific campaign
 * Uses the optimized campaign endpoint with pending-first sorting
 */
export const fetchCampaignLeads = async (
  campaignFilters: CampaignFilters
): Promise<CampaignLeadsResponse> => {
  if (!campaignFilters.campaignName) {
    throw new Error('Campaign name is required');
  }

  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }

  const headers = await createAuthHeaders();
  
  const requestBody = {
    campaignName: campaignFilters.campaignName,
    page: campaignFilters.page || 1,
    limit: campaignFilters.limit || 50,
  };

  const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Lead/campaign`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch campaign leads: ${response.status}`);
  }

  const data = await response.json();
  return {
    message: data.message,
    data: Array.isArray(data.data) ? data.data : [],
    totalLeads: data.totalLeads || 0,
  };
};

/**
 * Fetch all campaigns with their lead counts
 */
export const fetchCampaignsWithCounts = async (
  page = 1, 
  limit = 100
): Promise<CampaignsWithCountsResponse> => {
  if (!(await validateAuthToken())) {
    throw new Error('Authentication failed');
  }
  
  const headers = await createAuthHeaders();
  const campaignsUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/api/campaigns/with-counts?page=${page}&limit=${limit}&sortBy=leadCount&sortOrder=desc`;
  
  const response = await fetch(campaignsUrl, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch campaigns: HTTP ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return {
    data: result.data || [],
    pagination: result.pagination
  };
};
