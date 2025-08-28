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
  leadsPerPage
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
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    console.log('🚀 Refreshing leads data...');
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

      console.log('✅ Leads data refreshed:', {
        totalLeads: response.totalLeads,
        totalPages: calculatedTotalPages,
        currentPage: currentPage + 1,
        leadsOnThisPage: response.data.length,
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      Toast.show(`Error fetching leads: ${error.message}`, {
        duration: Toast.durations.LONG,
      });
      setLeads([]);
      setTotalLeads(0);
      setTotalPages(0);
    }

    setLoading(false);
  }, [user, filters, searchTerm, currentPage, leadsPerPage]);

  /**
   * Load filter options when user is available
   */
  const loadFilterOptions = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      console.log('📥 Loading filter options...');
      
      // Load all filter options in parallel
      const [statusOpts, sourceOpts, agentsData] = await Promise.all([
        fetchStatusOptions(),
        fetchSourceOptions(),
        fetchAgents(user),
      ]);

      setStatusOptions(statusOpts);
      setSourceOptions(sourceOpts);
      setAgents(agentsData);
      
      console.log('✅ Filter options loaded:', {
        statusOptions: statusOpts.length,
        sourceOptions: sourceOpts.length,
        agents: agentsData.length,
      });
    } catch (error) {
      console.error('Error loading filter options:', error);
      Toast.show('Error loading filter options', {
        duration: Toast.durations.SHORT,
      });
    }
  }, [user]);

  // Load initial data and filter options when user becomes available
  useEffect(() => {
    if (user && user.id) {
      loadFilterOptions();
      refreshLeads();
    }
  }, [user, loadFilterOptions, refreshLeads]);

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
