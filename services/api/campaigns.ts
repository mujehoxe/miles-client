import { createAuthHeaders, validateAuthToken } from './auth';
import { CampaignsResponse } from './types';

/**
 * Fetch all campaigns (tags) with their lead counts using optimized single endpoint
 * @param page - Page number for pagination (optional)
 * @param limit - Results per page (optional)
 * @returns Promise<CampaignsResponse> - Campaigns data with pagination info
 */
export const fetchCampaignsWithCounts = async (
  page = 1, 
  limit = 100
): Promise<CampaignsResponse> => {
  console.log('=== FETCH CAMPAIGNS DEBUG START ===');
  console.log('Base URL:', process.env.EXPO_PUBLIC_BASE_URL);
  
  const authValid = await validateAuthToken();
  console.log('Auth token valid:', authValid);
  
  if (!authValid) {
    console.error('Authentication failed in fetchCampaignsWithCounts');
    throw new Error('Authentication failed. Please login again.');
  }
  
  try {
    const headers = await createAuthHeaders();
    console.log('Headers created:', Object.keys(headers));
    
    // Try the new optimized endpoint first
    const campaignsUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/api/campaigns/with-counts?page=${page}&limit=${limit}&sortBy=leadCount&sortOrder=desc`;
    console.log('Fetching campaigns from optimized endpoint:', campaignsUrl);
    
    const campaignsResponse = await fetch(campaignsUrl, {
      method: 'GET',
      headers,
    });
    
    console.log('Campaigns response status:', campaignsResponse.status);
    console.log('Campaigns response ok:', campaignsResponse.ok);
    
    if (campaignsResponse.ok) {
      const campaignsResult = await campaignsResponse.json();
      console.log('=== OPTIMIZED CAMPAIGNS SUCCESS ===');
      console.log('Campaigns count:', campaignsResult.data?.length);
      console.log('Pagination:', campaignsResult.pagination);
      console.log('Sample campaigns:', campaignsResult.data?.slice(0, 3));
      console.log('=================================');
      
      return {
        data: campaignsResult.data || [],
        pagination: campaignsResult.pagination
      };
    }
    
    // Fallback to the old method if new endpoint doesn't exist yet
    console.log('Optimized endpoint not available, falling back to old method...');
    
    const tagsUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/api/tags/get?limit=1000`;
    console.log('Fetching tags from:', tagsUrl);
    
    // First, get all tags
    const tagsResponse = await fetch(tagsUrl, {
      method: 'GET',
      headers,
    });
    
    console.log('Tags response status:', tagsResponse.status);
    console.log('Tags response ok:', tagsResponse.ok);
    
    if (!tagsResponse.ok) {
      const errorText = await tagsResponse.text();
      console.error('Tags fetch failed. Status:', tagsResponse.status, 'Response:', errorText);
      throw new Error(`Failed to fetch tags: HTTP ${tagsResponse.status} - ${errorText}`);
    }
    
    const tagsResult = await tagsResponse.json();
    console.log('Tags result:', { dataLength: tagsResult.data?.length, keys: Object.keys(tagsResult) });
    const tags = tagsResult.data || [];
    
    // Get lead count for each tag (OLD METHOD - will be slow)
    console.log('WARNING: Using slow N+1 query method. Please implement /api/campaigns/with-counts endpoint!');
    const campaignsWithCounts = await Promise.all(
      tags.map(async (tag: any) => {
        try {
          const countResponse = await fetch(
            `${process.env.EXPO_PUBLIC_BASE_URL}/api/Lead/TagCount?tag=${tag._id}`,
            {
              method: 'GET',
              headers,
            }
          );
          
          if (countResponse.ok) {
            const countResult = await countResponse.json();
            return {
              _id: tag._id,
              Tag: tag.Tag,
              leadCount: countResult.count || 0,
            };
          } else {
            return {
              _id: tag._id,
              Tag: tag.Tag,
              leadCount: 0,
            };
          }
        } catch (error) {
          console.error(`Error fetching count for tag ${tag.Tag}:`, error);
          return {
            _id: tag._id,
            Tag: tag.Tag,
            leadCount: 0,
          };
        }
      })
    );
    
    // Sort by lead count descending, then by tag name
    const sortedCampaigns = campaignsWithCounts.sort((a, b) => {
      if (b.leadCount !== a.leadCount) {
        return b.leadCount - a.leadCount;
      }
      return a.Tag.localeCompare(b.Tag);
    });
    
    console.log('=== FALLBACK CAMPAIGNS SUCCESS ===');
    console.log('Final campaigns count:', sortedCampaigns.length);
    console.log('Sample campaigns:', sortedCampaigns.slice(0, 3));
    console.log('================================');
    
    return {
      data: sortedCampaigns,
      pagination: undefined // No pagination info available in fallback
    };
    
  } catch (error) {
    console.error('=== FETCH CAMPAIGNS API ERROR ===');
    console.error('Error in fetchCampaignsWithCounts:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('================================');
    throw error;
  }
};
