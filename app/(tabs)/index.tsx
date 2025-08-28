// =============================================
// IMPORTS
// =============================================

// Component imports
import FiltersModal from "@/components/FiltersModal";
import LeadCard from "@/components/LeadCard";
import LoadingView from "@/components/LoadingView";
import Pagination from "@/components/Pagination"; // ← NEW: Pagination component

// Hook imports
import useOneSignal from "@/hooks/useOneSignal";
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
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-root-toast";

// Context imports
import { UserContext } from "../_layout";

/**
 * Leads Page Component (Main Tab)
 *
 * This component manages the leads listing page with comprehensive features:
 *
 * CORE FEATURES:
 * - Lead listing with card-based display
 * - Search functionality with debounced input
 * - Advanced filtering (agents, status, sources, tags, date ranges)
 * - Multi-select lead actions
 * - Real-time data fetching with authentication
 *
 * PAGINATION FEATURES: ← NEW
 * - Server-side pagination with configurable page sizes
 * - Smart page navigation with Previous/Next buttons
 * - Direct page jumping with numbered buttons
 * - Auto-reset pagination on filter/search changes
 * - Loading states during page transitions
 *
 * TECHNICAL DETAILS:
 * - Uses 0-based page indexing internally
 * - Supports dynamic page size changes (10, 25, 50, 100)
 * - Integrates with existing filter system
 * - Maintains pagination state across component re-renders
 */
export default function Tab() {
  const user = useContext(UserContext);

  // Initialize OneSignal for push notifications
  useOneSignal(user);

  // =============================================
  // STATE MANAGEMENT
  // =============================================

  // Core data state
  const [leads, setLeads] = useState([]); // Current page leads
  const [loading, setLoading] = useState(true); // Initial/main loading state

  // ← PAGINATION STATE (NEW)
  const [currentPage, setCurrentPage] = useState(0); // Current page (0-based)
  const [leadsPerPage, setLeadsPerPage] = useState(10); // Items per page
  const [totalLeads, setTotalLeads] = useState(0); // Total leads count from API
  const [totalPages, setTotalPages] = useState(0); // Calculated total pages
  const [paginationLoading, setPaginationLoading] = useState(false); // Page transition loading

  // Search and selection state
  const [searchTerm, setSearchTerm] = useState(""); // Search input value
  const [selectedLeads, setSelectedLeads] = useState([]); // Multi-selected leads
  const [showFilters, setShowFilters] = useState(false); // Filter modal visibility

  // Filter state object
  const [filters, setFilters] = useState({
    searchTerm: "",
    searchBoxFilters: ["LeadInfo"],
    selectedAgents: [],
    selectedStatuses: [],
    selectedSources: [],
    selectedTags: [],
    dateRange: [null, null],
    dateFor: "LeadIntroduction",
  });

  // Filter options state (populated from API)
  const [statusOptions, setStatusOptions] = useState([]); // Available lead statuses
  const [sourceOptions, setSourceOptions] = useState([]); // Available lead sources
  const [tagOptions, setTagOptions] = useState([]); // Available tags
  const [agents, setAgents] = useState([]); // Available agents hierarchy
  // Static filter options arrays
  const [searchBoxOptions] = useState([
    { value: "LeadInfo", label: "By lead info" },
    { value: "Comments", label: "By comments" },
    { value: "Reminders", label: "By reminders" },
    { value: "Meetings", label: "By meetings" },
  ]);

  // ← PAGINATION OPTIONS (NEW) - Available page size options
  const [countOptions] = useState([
    { value: "10", label: "10 per page" },
    { value: "25", label: "25 per page" },
    { value: "50", label: "50 per page" },
    { value: "100", label: "100 per page" },
  ]);

  // =============================================
  // AUTHENTICATION & API UTILITIES
  // =============================================

  /**
   * Create standardized authentication headers for API requests
   *
   * This function creates headers that match the web application's format
   * to ensure consistent authentication across platforms.
   *
   * @returns {Promise<Object>} Headers object with authentication token
   * @throws {Error} When no authentication token is available
   */
  const createAuthHeaders = async () => {
    const storedToken = await SecureStore.getItemAsync("userToken");
    if (!storedToken) throw new Error("No authentication token available");

    // Standard headers that match web application requests
    return {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      Cookie: `token=${storedToken}`,
      referer: `${process.env.EXPO_PUBLIC_BASE_URL}/Leads/Marketing`,
      origin: `${process.env.EXPO_PUBLIC_BASE_URL}`,
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) MilesClient-Mobile/1.0.0",
      "x-requested-with": "XMLHttpRequest",
    };
  };

  // Fetch status options
  const fetchStatusOptions = async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/Status/get`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const statusOpts = data.data.map((status) => ({
          value: status._id,
          label: status.Status,
          color: status.color,
        }));
        setStatusOptions(statusOpts);
      } else {
        console.error("Failed to fetch status options:", response.status);
      }
    } catch (error) {
      console.error("Error fetching status options:", error);
    }
  };

  // Fetch source options
  const fetchSourceOptions = async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/Source/get`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const sourceOpts = data.data.map((source) => ({
          value: source._id,
          label: source.Source,
        }));
        setSourceOptions(sourceOpts);
      } else {
        console.error("Failed to fetch source options:", response.status);
      }
    } catch (error) {
      console.error("Error fetching source options:", error);
    }
  };

  // Fetch tag options
  const fetchTagOptions = async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/tags/get`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tagOpts = data.data.map((tag, index) => ({
          label: tag.Tag,
          value: tag.Tag + "::" + index,
        }));
        setTagOptions(tagOpts);
        return tagOpts; // Return for lazy loading
      } else {
        console.error("Failed to fetch tag options:", response.status);
        return [];
      }
    } catch (error) {
      console.error("Error fetching tag options:", error);
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
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/staff/get?preserveHierarchy=true`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const treeData = transformAgentsDataToTreeSelect(data.data);

        // Add non-assigned option as the first option if user has appropriate permissions OR is superAdmin
        const hasViewAllPermission =
          user.permissions?.lead?.includes("view_all") ||
          user.permissions?.lead?.includes("view_non_assigned") ||
          user.role === "superAdmin";

        const agentsWithNonAssigned = hasViewAllPermission
          ? [
              {
                value: "non-assigned",
                title: "Non-Assigned Leads",
                label: "Non-Assigned Leads",
              },
              ...treeData,
            ]
          : treeData;

        setAgents(agentsWithNonAssigned);
      } else {
        console.error("Failed to fetch agents:", response.status);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  // =============================================
  // CORE DATA FETCHING FUNCTIONS
  // =============================================

  /**
   * Main function to fetch leads with pagination support
   *
   * This function handles:
   * - Authentication and token validation
   * - Building paginated API request with current filters
   * - Processing response and updating pagination metadata
   * - Error handling and user feedback
   *
   * PAGINATION INTEGRATION: ← NEW
   * - Uses currentPage and leadsPerPage state for pagination
   * - Processes totalCount from API to calculate totalPages
   * - Updates pagination state after successful response
   *
   * @param {string} searchText - Optional search term to filter results
   */
  const fetchLeads = async (searchText = "") => {
    // Early exit if user is not available
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get authentication token from secure storage
      const storedToken = await SecureStore.getItemAsync("userToken");

      if (!storedToken) {
        Toast.show("Please login again to access leads", {
          duration: Toast.durations.LONG,
        });
        setLoading(false);
        return;
      }

      // Validate token expiry to prevent unnecessary API calls
      try {
        const tokenPayload = JSON.parse(atob(storedToken.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenExpiry = tokenPayload.exp;

        if (currentTime > tokenExpiry) {
          Toast.show("Your session has expired. Please login again.", {
            duration: Toast.durations.LONG,
          });
          await SecureStore.deleteItemAsync("userToken");
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        Toast.show("Invalid session token. Please login again.", {
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
        const hasNonAssigned = filters.selectedAgents.includes("non-assigned");
        if (hasNonAssigned) {
          console.log(
            "Filters: non-assigned leads selected via agents dropdown"
          );
          // Add special flags for backend to understand this request
          requestOptions.includeNonAssigned = true;
          if (
            user.permissions?.lead?.includes("view_non_assigned") ||
            user.permissions?.lead?.includes("view_all") ||
            user.role === "superAdmin"
          ) {
            requestOptions.viewAllLeads = true;
          }
        }
      } else if (user.role === "superAdmin") {
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
        dateFor: "LeadIntroduction", // Set default dateFor value
        searchBoxFilters: ["LeadInfo"],
        // ← PAGINATION PARAMETERS (NEW)
        page: currentPage + 1, // Convert 0-based to 1-based for API
        limit: leadsPerPage.toString(),
        userid: user.id,
        ...requestOptions, // Merge any special options for superAdmin
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/Lead/get`,
        {
          method: "POST",
          headers: {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
            Cookie: `token=${storedToken}`,
            referer: `${process.env.EXPO_PUBLIC_BASE_URL}/Leads/Marketing`,
            origin: `${process.env.EXPO_PUBLIC_BASE_URL}`,
            "user-agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) MilesClient-Mobile/1.0.0",
            "x-requested-with": "XMLHttpRequest",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const leadsData = data.data;

        // Log key API response info
        console.log("📋 API Response:", {
          keys: Object.keys(data),
          totalLeads: data.totalLeads,
          dataLength: Array.isArray(leadsData) ? leadsData.length : 0,
        });

        if (Array.isArray(leadsData)) {
          setLeads(leadsData);
        } else {
          setLeads([]);
        }

        // Use the correct totalLeads field from API response
        let totalCount = data.totalLeads || 0;

        console.log("✅ USING TOTAL LEADS:", totalCount);

        const calculatedTotalPages = Math.ceil(totalCount / leadsPerPage);
        console.log("🔄 Pagination Set:", {
          totalLeads: totalCount,
          totalPages: calculatedTotalPages,
          currentPage: currentPage + 1,
          leadsOnThisPage: leadsData.length,
        });
        setTotalLeads(totalCount);
        setTotalPages(calculatedTotalPages);
      } else {
        console.error(`API request failed with status ${response.status}`);
        const errorText = await response.text();
        console.error("Error response body:", errorText);
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
      // Reset to first page when search term changes
      if (currentPage !== 0) {
        setCurrentPage(0);
      }
      if (searchTerm) fetchLeads(searchTerm);
      else fetchLeads();
    }, 500);

    return () => {
      clearTimeout(delayedSearch);
      isMounted = false;
    };
  }, [searchTerm, user]);

  // Effect to handle filter changes - but avoid duplicate calls with handleFiltersChange
  useEffect(() => {
    if (!user) return;
    // Only fetch if filters have been explicitly changed and not from handleFiltersChange
    // This prevents duplicate API calls when filters are changed via the modal
    if (
      filters.selectedAgents.length > 0 ||
      filters.selectedStatuses.length > 0 ||
      filters.selectedSources.length > 0 ||
      filters.selectedTags.length > 0 ||
      filters.dateRange.some((date) => date !== null)
    ) {
      // Reset to first page when filters change
      if (currentPage !== 0) {
        setCurrentPage(0);
        return; // Let the currentPage effect handle the API call
      }
      fetchLeads(searchTerm);
    }
  }, [filters, user]);

  // Effect to handle pagination changes - only when currentPage changes
  useEffect(() => {
    if (!user) return;
    fetchLeads(searchTerm);
  }, [currentPage, user]);

  // Effect to handle leads per page changes
  useEffect(() => {
    if (!user) return;
    // Reset to first page when leads per page changes
    if (currentPage !== 0) {
      setCurrentPage(0);
      return; // Let the currentPage effect handle the API call
    }
    fetchLeads(searchTerm);
  }, [leadsPerPage, user]);

  if (!user) return <LoadingView />;

  const handleCardPress = (lead) => {
    setSelectedLeads((prev) => {
      const isSelected = prev.some((l) => l._id === lead._id);
      if (isSelected) {
        return prev.filter((l) => l._id !== lead._id);
      } else {
        return [...prev, lead];
      }
    });
  };

  const handleFiltersChange = (newFilters) => {
    console.log("Filters changed:", JSON.stringify(newFilters, null, 2));
    setFilters(newFilters);
    setSearchTerm(newFilters.searchTerm);
    // Reset to first page when filters change
    setCurrentPage(0);
    // Here you would refetch leads with the new filters
    fetchLeads(newFilters.searchTerm);
  };

  // =============================================
  // PAGINATION NAVIGATION FUNCTIONS ← NEW
  // =============================================

  /**
   * Handle page navigation (Previous/Next/Direct page selection)
   *
   * This function manages:
   * - Page transition loading states
   * - Data fetching for the new page
   * - Error handling with user feedback
   * - Prevention of duplicate requests
   *
   * @param {number} newPage - Target page number (0-based)
   */
  const handlePageChange = async (newPage: number) => {
    // Prevent unnecessary requests and duplicate loading
    if (newPage === currentPage || paginationLoading) return;

    setPaginationLoading(true);
    setCurrentPage(newPage);

    try {
      // Fetch data for the new page with current search/filter context
      await fetchLeads(searchTerm);
    } catch (error) {
      console.error("Error changing page:", error);
      Toast.show("Error loading page", {
        duration: Toast.durations.SHORT,
      });
    } finally {
      setPaginationLoading(false);
    }
  };

  /**
   * Handle page size change (items per page)
   *
   * This function manages:
   * - Updating the page size setting
   * - Resetting to first page (since current page may no longer exist)
   * - Automatic data refetch via useEffect dependency
   *
   * @param {number} newPerPage - New items per page count
   */
  const handlePerPageChange = (newPerPage: number) => {
    setLeadsPerPage(newPerPage);
    setCurrentPage(0); // Reset to first page since pagination structure changes
    // Note: fetchLeads will be triggered automatically by the useEffect watching leadsPerPage
  };

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
            <Text className="text-sm font-medium text-blue-500">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? "s" : ""}{" "}
              selected
            </Text>
            <TouchableOpacity
              className="py-1 px-2"
              onPress={() => setSelectedLeads([])}
            >
              <Text className="text-sm text-gray-500">Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-base text-gray-500">Loading leads...</Text>
        </View>
      ) : leads?.length > 0 ? (
        <View className="flex-1">
          <ScrollView
            className="flex-1 px-4 pt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {leads.map((lead, index) => (
              <LeadCard
                key={lead._id || index}
                lead={lead}
                selected={selectedLeads.some((l) => l._id === lead._id)}
                onCardPress={() => handleCardPress(lead)}
                onDetailsPress={() => console.log("details", lead._id)}
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
                className="bg-blue-500 px-5 py-2.5 rounded-lg mt-2"
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
