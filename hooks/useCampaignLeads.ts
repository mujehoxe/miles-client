import {
  fetchCampaignLeads,
  CampaignFilters,
  CampaignLeadsResponse,
} from "@/services/campaignApi";
import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-root-toast";

export interface UseCampaignLeadsProps {
  campaignName: string;
  currentPage?: number;
  leadsPerPage?: number;
  shouldFetchLeads?: boolean;
}

export interface UseCampaignLeadsReturn {
  // Data
  leads: any[];
  totalLeads: number;
  totalPages: number;

  // Loading states
  loading: boolean;
  paginationLoading: boolean;

  // Functions
  refreshLeads: () => Promise<void>;
  setPaginationLoading: (loading: boolean) => void;
}

/**
 * Custom hook to manage campaign leads data
 * Handles API calls for fetching leads for a specific campaign with pagination and sorting
 */
export const useCampaignLeads = ({
  campaignName,
  currentPage = 0,
  leadsPerPage = 50,
  shouldFetchLeads = true,
}: UseCampaignLeadsProps): UseCampaignLeadsReturn => {
  // Core data state
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);

  /**
   * Fetch campaign leads data with current parameters
   */
  const refreshLeads = useCallback(async () => {
    if (!campaignName || !shouldFetchLeads) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      const campaignFilters: CampaignFilters = {
        campaignName,
        page: currentPage + 1, // Convert 0-based to 1-based for API
        limit: leadsPerPage,
      };

      const response: CampaignLeadsResponse = await fetchCampaignLeads(campaignFilters);

      setLeads(response.data);
      setTotalLeads(response.totalLeads);

      const calculatedTotalPages = Math.ceil(response.totalLeads / leadsPerPage);
      setTotalPages(calculatedTotalPages);
    } catch (error: any) {
      Toast.show(`Error fetching campaign leads: ${error.message}`, {
        duration: Toast.durations.LONG,
      });
      setLeads([]);
      setTotalLeads(0);
      setTotalPages(0);
    }

    setLoading(false);
  }, [campaignName, currentPage, leadsPerPage, shouldFetchLeads]);

  // Fetch leads when parameters change
  useEffect(() => {
    if (campaignName && shouldFetchLeads) {
      refreshLeads();
    }
  }, [campaignName, shouldFetchLeads, refreshLeads]);

  return {
    // Data
    leads,
    totalLeads,
    totalPages,

    // Loading states
    loading,
    paginationLoading,

    // Functions
    refreshLeads,
    setPaginationLoading,
  };
};
