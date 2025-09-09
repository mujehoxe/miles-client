import { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-root-toast';
import { 
  fetchLeads, 
  fetchStatusOptions, 
  fetchSourceOptions, 
  fetchTagOptions, 
  fetchAgents,
  FilterOptions,
  FilterOption,
  TagsResponse 
} from '@/services/api';

export interface UseLeadsDataProps {
  user: any;
  filters: FilterOptions;
  searchTerm: string;
  currentPage: number;
  leadsPerPage: number;
  shouldFetchLeads?: boolean;
}

export interface UseLeadsDataReturn {
  // Data
  leads: any[];
  totalLeads: number;
  totalPages: number;
  
  // Filter options
  statusOptions: FilterOption[];
  sourceOptions: FilterOption[];
  tagOptions: FilterOption[];
  agents: any[];
  
  // Loading states
  loading: boolean;
  paginationLoading: boolean;
  
  // Functions
  refreshLeads: () => Promise<void>;
  setPaginationLoading: (loading: boolean) => void;
}

/**
 * Custom hook to manage leads data, filter options, and loading states
 * Handles API calls, pagination, and provides a clean interface for the component
 */
export const useLeadsData = ({
  user,
  filters,
  searchTerm,
  currentPage,
  leadsPerPage,
  shouldFetchLeads = true
}: UseLeadsDataProps): UseLeadsDataReturn => {
  // Core data state
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter options state
  const [statusOptions, setStatusOptions] = useState<FilterOption[]>([]);
  const [sourceOptions, setSourceOptions] = useState<FilterOption[]>([]);
  const [tagOptions, setTagOptions] = useState<FilterOption[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);

  /**
   * Fetch leads data with current parameters
   */
  const refreshLeads = useCallback(async () => {
    if (!user || !user.id || !shouldFetchLeads) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const response = await fetchLeads(
        user,
        filters,
        searchTerm,
        { page: currentPage, limit: leadsPerPage }
      );

      setLeads(response.data);
      setTotalLeads(response.totalLeads);
      
      const calculatedTotalPages = Math.ceil(response.totalLeads / leadsPerPage);
      setTotalPages(calculatedTotalPages);

    } catch (error) {
      Toast.show(`Error fetching leads: ${error.message}`, {
        duration: Toast.durations.LONG,
      });
      setLeads([]);
      setTotalLeads(0);
      setTotalPages(0);
    }

    setLoading(false);
  }, [user, filters, searchTerm, currentPage, leadsPerPage, shouldFetchLeads]);

  /**
   * Load filter options when user is available
   */
  const loadFilterOptions = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      
      // Load all filter options in parallel
      const [statusOpts, sourceOpts, agentsData, tagsResponse] = await Promise.all([
        fetchStatusOptions(),
        fetchSourceOptions(),
        fetchAgents(user),
        fetchTagOptions(1, 100), // Load initial tag options
      ]);

      setStatusOptions(statusOpts);
      setSourceOptions(sourceOpts);
      setAgents(agentsData);
      setTagOptions(tagsResponse.options);
      
    } catch (error) {
      Toast.show('Error loading filter options', {
        duration: Toast.durations.SHORT,
      });
    }
  }, [user]);

  // Load filter options when user becomes available
  useEffect(() => {
    if (user && user.id) {
      loadFilterOptions();
    }
  }, [user, loadFilterOptions]);
  
  // Fetch leads when user and shouldFetchLeads conditions are met
  useEffect(() => {
    if (user && user.id && shouldFetchLeads) {
      refreshLeads();
    }
  }, [user, shouldFetchLeads, refreshLeads]);

  return {
    // Data
    leads,
    totalLeads,
    totalPages,
    
    // Filter options
    statusOptions,
    sourceOptions,
    tagOptions,
    agents,
    
    // Loading states
    loading,
    paginationLoading,
    
    // Functions
    refreshLeads,
    setPaginationLoading,
  };
};
