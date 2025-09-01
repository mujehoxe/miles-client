// =============================================
// IMPORTS
// =============================================

// Component imports
import FiltersModal from "@/components/FiltersModal";
import LeadCard from "@/components/LeadCard";
import LoadingView from "@/components/LoadingView";
import Pagination from "@/components/Pagination";
import ReminderModal from "@/components/ReminderModal";

// Hook imports
import useOneSignal from "@/hooks/useOneSignal";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useFilters } from "@/hooks/useFilters";
import { usePagination } from "@/hooks/usePagination";
import { useLeadsSelection } from "@/hooks/useLeadsSelection";
import { useSearchDebounce } from "@/hooks/useSearchDebounce";
import { useContext, useEffect, useState } from "react";

// React Native imports
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party imports
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-root-toast";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";

// Context imports
import { UserContext } from "../_layout";

// Services and utilities
import { fetchTagOptions, getUsers, updateLead } from "@/services/api";
import { SEARCH_BOX_OPTIONS, COUNT_OPTIONS, DEFAULT_PAGINATION } from "@/utils/constants";

const fullConfig = resolveConfig(tailwindConfig);
const miles600 = fullConfig.theme.colors.miles[600];

/**
 * Leads Page Component (Main Tab)
 * 
 * Refactored component focused on UI rendering and user interactions.
 * Business logic has been extracted into custom hooks and services.
 *
 * FEATURES:
 * - Lead listing with card-based display and pagination
 * - Debounced search functionality
 * - Advanced filtering with modal interface
 * - Multi-select lead operations
 * - Responsive loading states
 */
export default function Tab() {
  const user = useContext(UserContext);
  useOneSignal(user);
  
  // Initialize search with debounce
  const { 
    searchTerm, 
    setSearchTerm, 
    clearSearch 
  } = useSearchDebounce({ 
    delay: DEFAULT_PAGINATION.DEBOUNCE_DELAY 
  });
  
  // Initialize filters
  const { 
    filters, 
    showFilters, 
    updateFilters, 
    setShowFilters, 
    clearFilters 
  } = useFilters();
  
  // Initialize pagination
  const { 
    currentPage, 
    leadsPerPage, 
    totalPages, 
    setCurrentPage, 
    setLeadsPerPage, 
    setTotalPages, 
    canGoNext, 
    canGoPrevious 
  } = usePagination({
    initialPage: DEFAULT_PAGINATION.PAGE,
    initialPageSize: DEFAULT_PAGINATION.PAGE_SIZE
  });
  
  // Initialize lead selection
  const {
    selectedLeads,
    toggleLeadSelection,
    clearSelection,
    isLeadSelected,
    selectedCount
  } = useLeadsSelection();
  
  // Initialize leads data with all dependencies
  const {
    leads,
    totalLeads,
    statusOptions,
    sourceOptions,
    tagOptions,
    agents,
    loading,
    paginationLoading,
    refreshLeads,
    setPaginationLoading
  } = useLeadsData({
    user,
    filters,
    searchTerm,
    currentPage,
    leadsPerPage,
    shouldFetchLeads: hasInitializedFilters || filters.selectedAgents.length > 0
  });
  
  // Additional state for leads management
  const [localLeads, setLocalLeads] = useState<any[]>([]);
  const [hasInitializedFilters, setHasInitializedFilters] = useState(false);
  
  // Reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderLeadId, setReminderLeadId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reminderCallback, setReminderCallback] = useState<(() => void) | null>(null);
  
  // Sync localLeads with leads from hook
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  // Initialize filters with default agents when agents data loads
  useEffect(() => {
    if (!hasInitializedFilters && agents.length > 0 && user && filters.selectedAgents.length === 0) {
      console.log('🎯 Initializing filters with default agents for user:', user.role || 'regular user');
      
      let defaultAgents: string[] = [];
      
      if (user.role === 'superAdmin') {
        // Select all agents for super admin
        const flattenAgents = (agentList: any[]): string[] => {
          let result: string[] = [];
          agentList.forEach(agent => {
            result.push(agent.value);
            if (agent.children) {
              result = result.concat(flattenAgents(agent.children));
            }
          });
          return result;
        };
        defaultAgents = flattenAgents(agents);
        console.log('👑 Super admin: selecting all agents:', defaultAgents.length);
      } else {
        // Find current user in agents list
        const flattenAgents = (agentList: any[]): any[] => {
          let result: any[] = [];
          agentList.forEach(agent => {
            result.push(agent);
            if (agent.children) {
              result = result.concat(flattenAgents(agent.children));
            }
          });
          return result;
        };
        
        const allAgents = flattenAgents(agents);
        const currentUserAgent = allAgents.find(agent => agent.value === user.id);
        if (currentUserAgent) {
          defaultAgents = [user.id];
          console.log('👤 Regular user: selecting self:', user.id);
        } else {
          console.log('⚠️ Current user not found in agents list, using empty selection');
        }
      }
      
      if (defaultAgents.length > 0) {
        const newFilters = {
          ...filters,
          selectedAgents: defaultAgents
        };
        updateFilters(newFilters);
      }
      
      setHasInitializedFilters(true);
    }
  }, [agents, user, filters, hasInitializedFilters, updateFilters]);

  // =============================================
  // EVENT HANDLERS
  // =============================================
  
  /**
   * Handle filter changes from the filters modal
   */
  const handleFiltersChange = (newFilters: any) => {
    console.log('🔄 Applying new filters');
    
    // Update filters and reset to first page
    updateFilters({ ...newFilters, searchTerm });
    setCurrentPage(0);
    
    // Also update the search term if it changed in filters
    if (newFilters.searchTerm !== searchTerm) {
      setSearchTerm(newFilters.searchTerm);
    }
  };
  
  /**
   * Handle page changes for pagination
   */
  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage || paginationLoading) return;
    
    setPaginationLoading(true);
    setCurrentPage(newPage);
    
    try {
      await refreshLeads();
    } catch (error) {
      console.error('Error changing page:', error);
      Toast.show('Error loading page', {
        duration: Toast.durations.SHORT,
      });
    } finally {
      setPaginationLoading(false);
    }
  };
  
  /**
   * Handle leads per page change from filters modal
   */
  const handleLeadsDataChange = (data: any) => {
    setLeadsPerPage(data.leadsPerPage);
    setCurrentPage(data.currentPage - 1); // Convert to 0-based
  };
  
  // Fetch users for reminder assignee options
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsersData();
  }, []);
  
  // Update totalPages when totalLeads changes
  useEffect(() => {
    const calculatedPages = Math.ceil(totalLeads / leadsPerPage);
    setTotalPages(calculatedPages);
  }, [totalLeads, leadsPerPage, setTotalPages]);
  
  // Early return if user not available
  if (!user) return <LoadingView />;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-3 pb-4 border-b border-gray-200">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 h-11">
            <Ionicons
              name="search"
              size={20}
              color="#6B7280"
              className="mr-2"
            />
            <TextInput
              className="flex-1 text-base text-gray-800"
              placeholder="Search leads..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-lg bg-gray-100 items-center justify-center"
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {selectedLeads.length > 0 && (
          <View className="flex-row items-center justify-between mt-3 px-1">
            <Text className="text-sm font-medium text-miles-500">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? "s" : ""}{" "}
              selected
            </Text>
            <TouchableOpacity
              className="py-1 px-2"
              onPress={clearSelection}
            >
              <Text className="text-sm text-gray-500">Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color={miles600} />
          <Text className="text-base text-gray-500">Loading leads...</Text>
        </View>
      ) : leads?.length > 0 ? (
        <View className="flex-1">
          <ScrollView
            className="flex-1 px-4 pt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {localLeads.map((lead, index) => (
              <LeadCard
                key={lead._id || index}
                lead={lead}
                selected={isLeadSelected(lead)}
                onCardPress={() => toggleLeadSelection(lead)}
                onDetailsPress={() => console.log("details", lead._id)}
                statusOptions={statusOptions}
                sourceOptions={sourceOptions}
                onLeadUpdate={async (leadId, updates) => {
                  try {
                    console.log('🔄 Updating lead:', leadId, updates);
                    
                    // Call API to update lead
                    const updatedLead = await updateLead(leadId, updates);
                    
                    // Update local state immediately
                    setLocalLeads(prevLeads => 
                      prevLeads.map(prevLead => 
                        prevLead._id === leadId 
                          ? {
                              ...updatedLead,
                              // Add comment info if description was provided
                              ...(updates.updateDescription && updates.updateDescription.length > 0
                                ? {
                                    lastComment: { Content: updates.updateDescription },
                                    commentCount: (prevLead.commentCount || 0) + 1,
                                  }
                                : {}),
                            }
                          : prevLead
                      )
                    );
                    
                    Toast.show('Lead updated successfully', {
                      duration: Toast.durations.SHORT,
                    });
                    
                  } catch (error) {
                    console.error('Failed to update lead:', error);
                    Toast.show(`Failed to update lead: ${error.message}`, {
                      duration: Toast.durations.LONG,
                    });
                  }
                }}
onOpenModal={(type, callback) => {
                  console.log('Opening modal:', type, 'for lead:', lead._id);
                  
                  if (type === 'Add Reminder') {
                    setReminderLeadId(lead._id);
                    setReminderCallback(() => callback);
                    setShowReminderModal(true);
                  } else if (type === 'Add Meeting') {
                    // TODO: Implement meeting modal
                    console.log('Meeting modal not implemented yet');
                    if (callback) callback();
                  } else {
                    if (callback) callback();
                  }
                }}
              />
            ))}
          </ScrollView>

          {/* Pagination Controls */}
          <View className="absolute bottom-0 left-0 right-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalLeads}
              itemsPerPage={leadsPerPage}
              onPageChange={handlePageChange}
              loading={paginationLoading}
            />
          </View>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center px-8 py-16">
          <View className="items-center max-w-72">
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
              No Leads Found
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6 mb-6">
              {searchTerm
                ? `No leads match your search "${searchTerm}"`
                : "No leads are available at the moment"}
            </Text>
            {searchTerm && (
              <TouchableOpacity
                className="bg-miles-500 px-5 py-2.5 rounded-lg mt-2"
                onPress={() => setSearchTerm("")}
              >
                <Text className="text-white text-sm font-medium">
                  Clear Search
                </Text>
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
        onLeadsDataChange={handleLeadsDataChange}
        statusOptions={statusOptions}
        sourceOptions={sourceOptions}
        tagOptions={tagOptions}
        agents={agents}
        searchBoxOptions={SEARCH_BOX_OPTIONS}
        countOptions={COUNT_OPTIONS}
        leadsData={{
          leadsPerPage,
          currentPage: currentPage + 1,
        }}
        onFetchTags={fetchTagOptions}
        currentUser={user}
      />
      
      {/* Reminder Modal */}
      <ReminderModal
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setReminderLeadId(null);
          setReminderCallback(null);
        }}
        leadId={reminderLeadId || ''}
        assigneesOptions={users}
        onSuccess={() => {
          console.log('✅ Reminder added successfully');
          
          // Execute callback if provided (for status changes requiring reminders)
          if (reminderCallback) {
            reminderCallback();
          }
          
          // Show success message
          Toast.show('Reminder added successfully', {
            duration: Toast.durations.SHORT,
          });
          
          // Close modal
          setShowReminderModal(false);
          setReminderLeadId(null);
          setReminderCallback(null);
        }}
      />
    </View>
  );
}
