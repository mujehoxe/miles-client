import LeadCard from "@/components/LeadCard";
import LoadingView from "@/components/LoadingView";
import FiltersModal from "@/components/FiltersModal";
import useOneSignal from "@/hooks/useOneSignal";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from "../_layout";

export default function Tab() {
  const user = useContext(UserContext);
  
  useOneSignal(user);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    searchBoxFilters: ['LeadInfo'],
    selectedAgents: [],
    selectedStatuses: [],
    selectedSources: [],
    selectedTags: [],
    dateRange: [null, null],
    dateFor: 'LeadIntroduction',
  });
  const [statusOptions, setStatusOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [searchBoxOptions] = useState([
    { value: 'LeadInfo', label: 'By lead info' },
    { value: 'Comments', label: 'By comments' },
    { value: 'Reminders', label: 'By reminders' },
    { value: 'Meetings', label: 'By meetings' },
  ]);
  const [countOptions] = useState([
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' },
  ]);

  
  // Function to create authenticated fetch headers
  const createAuthHeaders = async () => {
    const storedToken = await SecureStore.getItemAsync("userToken");
    if (!storedToken) {
      throw new Error('No authentication token available');
    }
    
    return {
      "accept": "application/json, text/plain, */*",
      "content-type": "application/json",
      "Cookie": `token=${storedToken}`,
      "referer": `${process.env.EXPO_PUBLIC_BASE_URL}/Leads/Marketing`,
      "origin": `${process.env.EXPO_PUBLIC_BASE_URL}`,
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) MilesClient-Mobile/1.0.0",
      "x-requested-with": "XMLHttpRequest",
    };
  };

  // Fetch status options
  const fetchStatusOptions = async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Status/get`, {
        method: "GET",
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        const statusOpts = data.data.map((status) => ({
          value: status._id,
          label: status.Status,
          color: status.color,
        }));
        setStatusOptions(statusOpts);
      } else {
        console.error('Failed to fetch status options:', response.status);
      }
    } catch (error) {
      console.error('Error fetching status options:', error);
    }
  };

  // Fetch source options
  const fetchSourceOptions = async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Source/get`, {
        method: "GET",
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        const sourceOpts = data.data.map((source) => ({
          value: source._id,
          label: source.Source,
        }));
        setSourceOptions(sourceOpts);
      } else {
        console.error('Failed to fetch source options:', response.status);
      }
    } catch (error) {
      console.error('Error fetching source options:', error);
    }
  };

  // Fetch tag options
  const fetchTagOptions = async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/tags/get`, {
        method: "GET",
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        const tagOpts = data.data.map((tag, index) => ({
          label: tag.Tag,
          value: tag.Tag + "::" + index,
        }));
        setTagOptions(tagOpts);
        return tagOpts; // Return for lazy loading
      } else {
        console.error('Failed to fetch tag options:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching tag options:', error);
      return [];
    }
  };

  // Transform agents data to tree structure like web app
  const transformAgentsDataToTreeSelect = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((userData) => ({
      value: userData._id,
      title: userData.username,
      label: userData.username, // For mobile compatibility
      children: userData.subordinates
        ? userData.subordinates.map((subordinate) => ({
            value: subordinate._id,
            title: subordinate.username,
            label: subordinate.username,
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

  // Fetch agents options with hierarchy
  const fetchAgents = async () => {
    if (!user || !user.id) return;
    
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/staff/get?preserveHierarchy=true`, {
        method: "GET",
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        const treeData = transformAgentsDataToTreeSelect(data.data);
        
        // Add non-assigned option as the first option if user has appropriate permissions OR is superAdmin
        const hasViewAllPermission = user.permissions?.lead?.includes('view_all') || 
                                    user.permissions?.lead?.includes('view_non_assigned') || 
                                    user.role === 'superAdmin';
        
        const agentsWithNonAssigned = hasViewAllPermission
          ? [
              {
                value: 'non-assigned',
                title: 'Non-Assigned Leads',
                label: 'Non-Assigned Leads',
              },
              ...treeData
            ]
          : treeData;
        
        setAgents(agentsWithNonAssigned);
      } else {
        console.error('Failed to fetch agents:', response.status);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchLeads = async (searchText = "") => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const storedToken = await SecureStore.getItemAsync("userToken");
      
      if (!storedToken) {
        Toast.show('Please login again to access leads', {
          duration: Toast.durations.LONG,
        });
        setLoading(false);
        return;
      }
      
      // Check if token is expired
      try {
        const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenExpiry = tokenPayload.exp;
        
        if (currentTime > tokenExpiry) {
          Toast.show('Your session has expired. Please login again.', {
            duration: Toast.durations.LONG,
          });
          await SecureStore.deleteItemAsync("userToken");
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        Toast.show('Invalid session token. Please login again.', {
          duration: Toast.durations.LONG,
        });
        await SecureStore.deleteItemAsync("userToken");
        setLoading(false);
        return;
      }
      
      // Determine selected agents from filters
      let selectedAgents = [];
      let requestOptions = {};

      if (filters?.selectedAgents && filters.selectedAgents.length > 0) {
        selectedAgents = filters.selectedAgents;
        
        // Check if 'non-assigned' is selected and add special flags
        const hasNonAssigned = filters.selectedAgents.includes('non-assigned');
        if (hasNonAssigned) {
          console.log('Filters: non-assigned leads selected via agents dropdown');
          // Add special flags for backend to understand this request
          requestOptions.includeNonAssigned = true;
          if (user.permissions?.lead?.includes('view_non_assigned') || user.permissions?.lead?.includes('view_all') || user.role === 'superAdmin') {
            requestOptions.viewAllLeads = true;
          }
        }
      } else if (user.role === 'superAdmin') {
        // For superAdmin with no explicit selection, let backend decide scope
        selectedAgents = [];
        requestOptions = { viewAllLeads: true };
      } else {
        selectedAgents = [user.id];
      }
      
      const requestBody = {
        searchTerm: searchText.trim(),
        selectedAgents: selectedAgents,
        selectedStatuses: [],
        selectedSources: [],
        selectedTags: [],
        date: [],
        dateFor: 'LeadIntroduction', // Set default dateFor value
        searchBoxFilters: ["LeadInfo"],
        page: currentPage + 1,
        limit: leadsPerPage.toString(),
        userid: user.id,
        ...requestOptions, // Merge any special options for superAdmin
      };
      
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/Lead/get`, {
        method: "POST",
        headers: {
          "accept": "application/json, text/plain, */*",
          "content-type": "application/json",
          "Cookie": `token=${storedToken}`,
          "referer": `${process.env.EXPO_PUBLIC_BASE_URL}/Leads/Marketing`,
          "origin": `${process.env.EXPO_PUBLIC_BASE_URL}`,
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) MilesClient-Mobile/1.0.0",
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        const leadsData = data.data;
        
        if (Array.isArray(leadsData)) {
          setLeads(leadsData);
        } else {
          setLeads([]);
        }
      } else {
        console.error(`API request failed with status ${response.status}`);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        setLeads([]);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      Toast.show("Error fetching leads: " + error.message, {
        duration: Toast.durations.LONG,
      });
      setLeads([]);
    }
    setLoading(false);
  };

  // Fetch filter options when user is available
  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchStatusOptions();
      fetchSourceOptions();
      fetchAgents();
      // Don't fetch tags initially - they will be loaded lazily
    }
  }, [user]);

  useEffect(() => {
    if (!user) return; // Don't fetch if user is not available
    
    let isMounted = true;

    const delayedSearch = setTimeout(() => {
      if (searchTerm) fetchLeads(searchTerm);
      else fetchLeads();
    }, 500);

    return () => {
      clearTimeout(delayedSearch);
      isMounted = false;
    };
  }, [searchTerm, user]);

  // Effect to handle filter changes
  useEffect(() => {
    if (!user) return;
    // Only fetch if filters have been explicitly changed (not initial state)
    if (filters.selectedAgents.length > 0 || 
        filters.selectedStatuses.length > 0 || 
        filters.selectedSources.length > 0 || 
        filters.selectedTags.length > 0 || 
        filters.dateRange.some(date => date !== null)) {
      fetchLeads();
    }
  }, [filters, user]);

  if (!user) return <LoadingView />;

  const handleCardPress = (lead) => {
    setSelectedLeads(prev => {
      const isSelected = prev.some(l => l._id === lead._id);
      if (isSelected) {
        return prev.filter(l => l._id !== lead._id);
      } else {
        return [...prev, lead];
      }
    });
  };

  const handleFiltersChange = (newFilters) => {
    console.log('Filters changed:', JSON.stringify(newFilters, null, 2));
    setFilters(newFilters);
    setSearchTerm(newFilters.searchTerm);
    // Here you would refetch leads with the new filters
    fetchLeads(newFilters.searchTerm);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search leads..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {selectedLeads.length > 0 && (
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionText}>
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity 
              style={styles.clearSelectionButton}
              onPress={() => setSelectedLeads([])}
            >
              <Text style={styles.clearSelectionText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : leads?.length > 0 ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {leads.map((lead, index) => (
            <LeadCard 
              key={lead._id || index} 
              lead={lead} 
              selected={selectedLeads.some(l => l._id === lead._id)}
              onCardPress={() => handleCardPress(lead)}
              onDetailsPress={() => console.log("details", lead._id)} 
            />
          ))}
          {/* Load more indicator */}
          <View style={styles.loadMoreContainer}>
            <Text style={styles.loadMoreText}>Showing {leads.length} leads</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Leads Found</Text>
            <Text style={styles.emptyStateDescription}>
              {searchTerm ? 
                `No leads match your search "${searchTerm}"` : 
                'No leads are available at the moment'
              }
            </Text>
            {searchTerm && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchTerm('')}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filters Modal */}
      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onLeadsDataChange={(data) => {
          setLeadsPerPage(data.leadsPerPage);
          setCurrentPage(data.currentPage - 1);
        }}
        statusOptions={statusOptions}
        sourceOptions={sourceOptions}
        tagOptions={tagOptions}
        agents={agents}
        searchBoxOptions={searchBoxOptions}
        countOptions={countOptions}
        leadsData={{
          leadsPerPage,
          currentPage: currentPage + 1,
        }}
        onFetchTags={fetchTagOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  clearSelectionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearSelectionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
