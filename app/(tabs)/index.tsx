// =============================================
// IMPORTS
// =============================================

// Component imports
import ActionButtons from "@/components/ActionButtons";
import BulkModal from "@/components/BulkModal";
import FiltersModal from "@/components/FiltersModal";
import LoadingView from "@/components/LoadingView";
import MeetingModal from "@/components/MeetingModal";
import ReminderModal from "@/components/ReminderModal";
import LeadsHeader from "@/components/leads/LeadsHeader";
import LeadsContent from "@/components/leads/LeadsContent";
import LeadTypeModal from "@/components/leads/LeadTypeModal";

// Hook imports
import { useFilters } from "@/hooks/useFilters";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useLeadsSelection } from "@/hooks/useLeadsSelection";
import { useNavigationHeader } from "@/hooks/useNavigationHeader";
import useOneSignal from "@/hooks/useOneSignal";
import { usePagination } from "@/hooks/usePagination";
import { useSearchDebounce } from "@/hooks/useSearchDebounce";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// React Native imports
import {
  ScrollView,
  View,
} from "react-native";

// Third-party imports
import Toast from "react-native-root-toast";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";

// Context imports
import { UserContext } from "../_layout";

// Services and utilities
import {
  deleteLeads,
  exportLeads,
  fetchStatusCounts,
  fetchTagOptions,
  updateLead,
} from "@/services/api";
import {
  COUNT_OPTIONS,
  DEFAULT_PAGINATION,
  SEARCH_BOX_OPTIONS,
} from "@/utils/constants";
import ModalManager from "@/utils/ModalManager";
import { LeadType } from "@/components/LeadTypeDropdown";

const fullConfig = resolveConfig(tailwindConfig);
const miles600 = fullConfig.theme.colors.miles[600];

/**
 * Leads Page Component (Main Tab)
 *
 * Refactored component with improved structure and separation of concerns.
 * Business logic has been extracted into custom hooks and reusable components.
 *
 * FEATURES:
 * - Lead listing with card-based display and pagination
 * - Debounced search functionality
 * - Advanced filtering with modal interface
 * - Multi-select lead operations
 * - Lead type switching (Community/Marketing)
 * - Responsive loading states
 */
export default function LeadsPage() {
  const user = useContext(UserContext);
  useOneSignal(user);

  // Core state management hooks
  const { searchTerm, setSearchTerm } = useSearchDebounce({
    delay: DEFAULT_PAGINATION.DEBOUNCE_DELAY,
  });

  const { filters, showFilters, updateFilters, setShowFilters } = useFilters();

  const {
    currentPage,
    leadsPerPage,
    setCurrentPage,
    setLeadsPerPage,
  } = usePagination({
    initialPage: DEFAULT_PAGINATION.PAGE,
    initialPageSize: DEFAULT_PAGINATION.PAGE_SIZE,
  });

  const {
    selectedLeads,
    toggleLeadSelection,
    clearSelection,
    selectAll,
    isLeadSelected,
  } = useLeadsSelection();

  const {
    leads,
    totalLeads,
    totalPages,
    statusOptions,
    sourceOptions,
    tagOptions,
    agents,
    loading,
    paginationLoading,
    refreshLeads,
    setPaginationLoading,
  } = useLeadsData({
    user,
    filters,
    searchTerm,
    currentPage,
    leadsPerPage,
    shouldFetchLeads: filters.selectedAgents.length > 0,
  });

  // Component state
  const [localLeads, setLocalLeads] = useState<any[]>([]);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);

  // Modal states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderLeadId, setReminderLeadId] = useState<string | null>(null);
  const [reminderCallback, setReminderCallback] = useState<(() => void) | null>(null);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingLeadId, setMeetingLeadId] = useState<string | null>(null);
  const [meetingCallback, setMeetingCallback] = useState<(() => void) | null>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOperationMade, setBulkOperationMade] = useState(false);

  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [statusCountsExpanded, setStatusCountsExpanded] = useState(false);
  const [statusCounts, setStatusCounts] = useState<{
    [key: string]: { count: number; filteredCount: number };
  }>({});
  const [statusCountsLoading, setStatusCountsLoading] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const leadCardRefs = useRef<{ [key: string]: View | null }>({});

  // Navigation header setup
  useNavigationHeader({
    leadType: filters.leadType || 'marketing',
    onHeaderPress: () => setHeaderDropdownOpen(true),
  });

  // User permissions for ActionButtons and LeadCard
  const userPermissions = useMemo(() => {
    if (!user) return { lead: [] };

    // Default permissions for regular users
    const permissions = {
      export: false,
      delete: false,
      mapLeads: false,
      lead: ["update_status", "update_source"] as string[], // Default lead permissions
    };

    // Grant permissions based on user role
    if (user.role) {
      const role = user.role.toLowerCase();

      // Admin and superAdmin get all permissions
      if (role === "admin" || role === "superadmin" || role.includes("admin")) {
        permissions.export = true;
        permissions.delete = true;
        permissions.mapLeads = true;
        permissions.lead = [
          "update_status",
          "update_source",
          "update_assigned",
          "delete_lead",
        ];
      }
      // Team leads might get some permissions
      else if (role.includes("lead") || role.includes("manager")) {
        permissions.export = true;
        permissions.lead = [
          "update_status",
          "update_source",
          "update_assigned",
        ];
        permissions.mapLeads = true;
        // Delete permission could be restricted for leads
      }
      // Regular agents get limited permissions
      else {
        permissions.export = true; // Allow agents to export their own leads
        // Other permissions remain false
      }
    }

    return permissions;
  }, [user]);

  // Sync localLeads with leads from hook
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  // Options are now loaded from useLeadsData hook

  // Initialize filters with default agents when agents data loads
  useEffect(() => {
    if (agents.length > 0 && user && filters.selectedAgents.length === 0) {
      let defaultAgents: string[] = [];

      if (user.role === "superAdmin") {
        // Select all agents for super admin
        const flattenAgents = (agentList: any[]): string[] => {
          let result: string[] = [];
          agentList.forEach((agent) => {
            result.push(agent.value);
            if (agent.children) {
              result = result.concat(flattenAgents(agent.children));
            }
          });
          return result;
        };
        defaultAgents = flattenAgents(agents);
      } else {
        // Find current user in agents list
        const flattenAgents = (agentList: any[]): any[] => {
          let result: any[] = [];
          agentList.forEach((agent) => {
            result.push(agent);
            if (agent.children) {
              result = result.concat(flattenAgents(agent.children));
            }
          });
          return result;
        };

        const allAgents = flattenAgents(agents);
        const currentUserAgent = allAgents.find(
          (agent) => agent.value === user.id
        );
        if (currentUserAgent) {
          defaultAgents = [user.id];
        } else {
        }
      }

      if (defaultAgents.length > 0) {
        const newFilters = {
          ...filters,
          selectedAgents: defaultAgents,
        };
        updateFilters(newFilters);
      }
    }
  }, [agents, user, filters, updateFilters]);

  // =============================================
  // EVENT HANDLERS
  // =============================================

  /**
   * Handle filter changes from the filters modal
   */
  const handleFiltersChange = (newFilters: any) => {
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
      console.error(error);
      Toast.show("Error loading page", {
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

  /**
   * Handle lead type change from dropdown
   */
  const handleLeadTypeChange = useCallback(
    (leadType: LeadType) => {
      // Find the appropriate sources based on lead type
      let newSelectedSources: string[] = [];

      if (leadType === "community") {
        // Find the source with "leads" name (case insensitive)
        const communitySource = sourceOptions.find((source) =>
          source.label.toLowerCase().includes("lead")
        );
        if (communitySource) {
          newSelectedSources = [communitySource.value];
        }
      } else {
        // For marketing, select all sources except the "leads" source
        newSelectedSources = sourceOptions
          .filter((source) => !source.label.toLowerCase().includes("lead"))
          .map((source) => source.value);
      }

      const newFilters = {
        ...filters,
        leadType,
        selectedSources: newSelectedSources,
      };

      updateFilters(newFilters);
      setCurrentPage(0); // Reset to first page
    },
    [filters, sourceOptions, updateFilters]
  );

  // Convert agents to user format for assignee options (excludes non-assigned)
  const getUsersFromAgents = (agentsList: any[]): any[] => {
    const flattenAgents = (agentList: any[]): any[] => {
      let result: any[] = [];
      agentList.forEach((agent) => {
        // Skip non-assigned option for modal assignee selections
        if (agent.value === "non-assigned") {
          return;
        }

        // Convert agent format to user format
        result.push({
          _id: agent.value,
          username: agent.label,
          Role: agent.role || "agent", // Use actual role from data, fallback to 'agent'
        });
        if (agent.children) {
          result = result.concat(flattenAgents(agent.children));
        }
      });
      return result;
    };

    return flattenAgents(agentsList);
  };

  // Flatten agents for BulkModal (keeps original format but flattened)
  const getFlattenedAgents = (agentsList: any[]): any[] => {
    const flattenAgents = (agentList: any[]): any[] => {
      let result: any[] = [];
      agentList.forEach((agent) => {
        // Skip non-assigned option
        if (agent.value === "non-assigned") {
          return;
        }

        // Keep original agent format
        result.push({
          value: agent.value,
          label: agent.label,
          role: agent.role,
        });
        if (agent.children) {
          result = result.concat(flattenAgents(agent.children));
        }
      });
      return result;
    };

    return flattenAgents(agentsList);
  };

  // Convert agents to user format including non-assigned (for filters)
  const getAllUsersFromAgents = (agentsList: any[]): any[] => {
    const flattenAgents = (agentList: any[]): any[] => {
      let result: any[] = [];
      agentList.forEach((agent) => {
        // Include all agents including non-assigned for filters
        result.push({
          _id: agent.value,
          username: agent.label,
          Role: agent.role || "agent",
          value: agent.value, // Keep original value for filter compatibility
          label: agent.label, // Keep original label for filter compatibility
        });
        if (agent.children) {
          result = result.concat(flattenAgents(agent.children));
        }
      });
      return result;
    };

    return flattenAgents(agentsList);
  };

  // Process agents data for filters - adds non-assigned option at top for admin users
  const processAgentsForFilters = (agentsList: any[]): any[] => {
    if (!user || !agentsList || agentsList.length === 0) {
      return agentsList;
    }

    // Check if user has admin role (admin, superAdmin, or any role containing 'admin')
    const isAdmin =
      user.role &&
      (user.role === "admin" ||
        user.role === "superAdmin" ||
        user.role.toLowerCase().includes("admin"));

    if (!isAdmin) {
      return agentsList; // Return original list if not admin
    }

    // Create a copy of the agents list
    const processedAgents = [...agentsList];

    // Check if non-assigned already exists to avoid duplicates
    const hasNonAssigned = processedAgents.some(
      (agent) => agent.value === "non-assigned"
    );

    if (!hasNonAssigned) {
      // Add non-assigned option at the beginning
      processedAgents.unshift({
        value: "non-assigned",
        title: "Non Assigned",
        label: "Non Assigned",
        role: "system", // Special role to identify this as a system option
        children: undefined,
      });
    }

    return processedAgents;
  };

  // =============================================
  // ACTION BUTTON HANDLERS
  // =============================================

  /**
   * Handle select all toggle for ActionButtons
   */
  const handleSelectAll = useCallback(() => {
    if (selectedLeads.length === localLeads.length && localLeads.length > 0) {
      // If all current page leads are selected, clear selection
      clearSelection();
    } else {
      // Select all current page leads
      selectAll(localLeads);
    }
  }, [selectedLeads.length, localLeads, clearSelection, selectAll]);

  /**
   * Handle export action
   */
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);

      let blob: Blob;
      if (selectedLeads.length > 0) {
        // Export selected leads
        const leadIds = selectedLeads.map((lead) => lead._id);
        blob = await exportLeads(leadIds, undefined, undefined, "cold");
      } else {
        // Export filtered leads
        blob = await exportLeads(undefined, filters, user, "cold");
      }

      // Handle blob download (React Native doesn't have direct download, but we'll show success)
      Toast.show(
        selectedLeads.length > 0
          ? `${selectedLeads.length} leads exported successfully`
          : "Leads exported successfully",
        {
          duration: Toast.durations.SHORT,
        }
      );
    } catch (error) {
      console.error(error);
      Toast.show(`Export failed: ${error.message}`, {
        duration: Toast.durations.LONG,
      });
    } finally {
      setIsExporting(false);
    }
  }, [selectedLeads, filters, user]);

  /**
   * Handle delete action
   */
  const handleDelete = useCallback(async () => {
    if (selectedLeads.length === 0) return;

    try {
      const leadIds = selectedLeads.map((lead) => lead._id);
      await deleteLeads(leadIds);

      // Remove deleted leads from local state
      setLocalLeads((prevLeads) =>
        prevLeads.filter((lead) => !leadIds.includes(lead._id))
      );

      // Clear selection
      clearSelection();

      // Refresh leads data to get updated totals
      await refreshLeads();

      Toast.show(
        `${leadIds.length} lead${
          leadIds.length > 1 ? "s" : ""
        } deleted successfully`,
        {
          duration: Toast.durations.SHORT,
        }
      );
    } catch (error) {
      console.error(error);
      Toast.show(`Delete failed: ${error.message}`, {
        duration: Toast.durations.LONG,
      });
    }
  }, [selectedLeads, clearSelection, refreshLeads]);

  /**
   * Handle bulk actions - opens the bulk modal
   */
  const handleBulkActions = useCallback(() => {
    if (selectedLeads.length === 0) {
      Toast.show("Please select leads for bulk actions", {
        duration: Toast.durations.SHORT,
      });
      return;
    }

    setShowBulkModal(true);
  }, [selectedLeads.length]);

  /**
   * Handle bulk operation completion
   */
  const handleBulkOperationComplete = useCallback(async () => {
    // Clear selection after bulk operation
    clearSelection();

    // Refresh leads data to reflect changes
    await refreshLeads();

    // Toggle bulk operation flag to trigger any necessary updates
    setBulkOperationMade((prev) => !prev);
  }, [clearSelection, refreshLeads]);

  /**
   * Handle history action (placeholder for now)
   */
  const handleHistory = useCallback(() => {
    // This could open a history modal or navigate to history page
    Toast.show("History feature coming soon", {
      duration: Toast.durations.SHORT,
    });
  }, []);

  /**
   * Handle deal submission for selected lead
   */
  const handleDealSubmission = useCallback(() => {
    if (selectedLeads.length !== 1) return;

    const selectedLead = selectedLeads[0];
    if (selectedLead.LeadStatus?.Status !== "Closure") return;

    // This could navigate to a deal submission form or open a modal
    Toast.show(
      `Opening deal submission for ${selectedLead.Name || "selected lead"}`,
      {
        duration: Toast.durations.SHORT,
      }
    );
  }, [selectedLeads]);

  /**
   * Handle status filter when clicking on status badge (supports multiple selection)
   */
  const handleStatusFilter = useCallback(
    (statusValue: string) => {
      const currentSelectedStatuses = filters.selectedStatuses || [];
      let newSelectedStatuses;

      if (currentSelectedStatuses.includes(statusValue)) {
        // Remove status if already selected
        newSelectedStatuses = currentSelectedStatuses.filter(
          (status) => status !== statusValue
        );
      } else {
        // Add status if not selected
        newSelectedStatuses = [...currentSelectedStatuses, statusValue];
      }

      const newFilters = {
        ...filters,
        selectedStatuses: newSelectedStatuses,
      };
      updateFilters(newFilters);
      setCurrentPage(0);

      // Expand status counts if collapsed
      if (!statusCountsExpanded) {
        setStatusCountsExpanded(true);
      }
    },
    [filters, updateFilters, setCurrentPage, statusCountsExpanded]
  );


  // Fetch status counts from API when filters change
  useEffect(() => {
    if (!user) return;

    const fetchStatusCountsData = async () => {
      setStatusCountsLoading(true);
      try {
        const statusCountsData = await fetchStatusCounts(
          user,
          filters,
          searchTerm
        );
        setStatusCounts(statusCountsData);
      } catch (error) {
        console.error(error);
        setStatusCounts({});
      } finally {
        setStatusCountsLoading(false);
      }
    };

    fetchStatusCountsData();
  }, [
    user,
    filters.selectedAgents,
    filters.selectedStatuses,
    filters.selectedSources,
    filters.selectedTags,
    filters.dateRange,
    filters.dateFor,
    filters.searchBoxFilters,
    searchTerm,
  ]);

  /**
   * Handle lead update from LeadCard component
   */
  const handleLeadUpdate = useCallback(
    async (leadId: string, updates: any) => {
      try {
        await updateLead(user, leadId, updates);

        // Update local lead state
        setLocalLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, ...updates } : lead
          )
        );

        // Show success message
        Toast.show("Lead updated successfully", {
          duration: Toast.durations.SHORT,
        });

        // Refresh leads data to get updated status counts
        await refreshLeads();
      } catch (error) {
        console.error("Failed to update lead:", error);
        Toast.show(`Failed to update lead: ${error.message}`, {
          duration: Toast.durations.LONG,
        });
        throw error; // Re-throw to let the LeadCard handle UI state
      }
    },
    [user, refreshLeads]
  );

  // Function to scroll to a specific lead card when comment input opens
  const scrollToCard = useCallback((leadId: string) => {
    const cardRef = leadCardRefs.current[leadId];
    const scrollView = scrollViewRef.current;

    if (!cardRef || !scrollView) {
      console.warn("❌ Missing refs for scrolling:", {
        cardRef: !!cardRef,
        scrollView: !!scrollView,
      });
      return;
    }

    // Try measureLayout first (more accurate for ScrollView)
    cardRef.measureLayout(
      scrollView as any,
      (x, y, width, height) => {
        // Calculate optimal scroll position
        // Account for header (~140px), action buttons (~60px), and padding
        const headerHeight = 140;
        const actionButtonsHeight = 60;
        const padding = 50;
        const totalOffset = headerHeight + actionButtonsHeight + padding;

        const targetY = Math.max(0, y - totalOffset);

        scrollView.scrollTo({
          y: targetY,
          animated: true,
        });
      },
      (error) => {
        console.warn("❌ measureLayout failed, trying measureInWindow:", error);

        // Fallback: measureInWindow approach
        cardRef.measureInWindow((x, y, width, height) => {
          // For measureInWindow, we need to calculate differently
          // Get current scroll position first
          scrollView.scrollTo({ y: 0, animated: false }); // Reset to get baseline

          setTimeout(() => {
            cardRef.measureInWindow((newX, newY, newWidth, newHeight) => {
              const targetScrollY = Math.max(0, newY - 200);

              scrollView.scrollTo({
                y: targetScrollY,
                animated: true,
              });
            });
          }, 50);
        });
      }
    );
  }, []);

  // Early return if user not available
  if (!user) return <LoadingView />;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search and Filter Header */}
      <LeadsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFiltersPress={() => setShowFilters(true)}
        selectedLeads={selectedLeads}
        onClearSelection={clearSelection}
      />

      {/* Action Buttons - Show when there are leads available */}
      {!loading && leads?.length > 0 && (
        <ActionButtons
          selectedLeads={selectedLeads}
          totalLeads={localLeads.length}
          onSelectAll={handleSelectAll}
          onClearSelection={clearSelection}
          onExport={userPermissions.export ? handleExport : undefined}
          onDelete={userPermissions.delete ? handleDelete : undefined}
          onBulkActions={userPermissions.mapLeads ? handleBulkActions : undefined}
          onHistory={userPermissions.mapLeads ? handleHistory : undefined}
          onDealSubmission={handleDealSubmission}
          isExporting={isExporting}
          userPermissions={userPermissions}
        />
      )}

      {/* Main Content */}
      <LeadsContent
        loading={loading}
        leads={leads}
        localLeads={localLeads}
        searchTerm={searchTerm}
        filters={filters}
        statusOptions={statusOptions}
        sourceOptions={sourceOptions}
        statusCounts={statusCounts}
        statusCountsLoading={statusCountsLoading}
        statusCountsExpanded={statusCountsExpanded}
        selectedLeads={selectedLeads}
        userPermissions={userPermissions}
        leadCardRefs={leadCardRefs}
        scrollViewRef={scrollViewRef}
        currentPage={currentPage}
        totalPages={totalPages}
        totalLeads={totalLeads}
        leadsPerPage={leadsPerPage}
        paginationLoading={paginationLoading}
        miles600={miles600}
        onStatusCountsExpandedChange={setStatusCountsExpanded}
        onStatusFilter={handleStatusFilter}
        onClearStatusFilter={() => {
          const newFilters = { ...filters, selectedStatuses: [] };
          updateFilters(newFilters);
          setCurrentPage(0);
        }}
        onLeadUpdate={handleLeadUpdate}
        onPageChange={handlePageChange}
        onModalOpen={(type, leadId, callback) => {
          if (type === "Add Reminder") {
            const modalId = "reminder-modal";
            if (ModalManager.canOpenModal(modalId)) {
              ModalManager.closeAllExcept(modalId);
              setReminderLeadId(leadId);
              setReminderCallback(() => callback);
              setShowReminderModal(true);
              ModalManager.registerModal(modalId, () => {
                setShowReminderModal(false);
                setReminderLeadId(null);
                setReminderCallback(null);
              });
            }
          } else if (type === "Add Meeting") {
            const modalId = "meeting-modal";
            if (ModalManager.canOpenModal(modalId)) {
              ModalManager.closeAllExcept(modalId);
              setMeetingLeadId(leadId);
              setMeetingCallback(() => callback);
              setShowMeetingModal(true);
              ModalManager.registerModal(modalId, () => {
                setShowMeetingModal(false);
                setMeetingLeadId(null);
                setMeetingCallback(null);
              });
            }
          } else {
            if (callback) callback();
          }
        }}
        isLeadSelected={isLeadSelected}
        toggleLeadSelection={toggleLeadSelection}
        scrollToCard={scrollToCard}
        setSearchTerm={setSearchTerm}
        updateFilters={updateFilters}
        setCurrentPage={setCurrentPage}
      />

      {/* Lead Type Selection Modal */}
      <LeadTypeModal
        visible={headerDropdownOpen}
        selectedType={filters.leadType || 'marketing'}
        onClose={() => setHeaderDropdownOpen(false)}
        onTypeChange={handleLeadTypeChange}
      />

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
        agents={processAgentsForFilters(agents)}
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
          ModalManager.unregisterModal("reminder-modal");
          setTimeout(() => {
            setShowReminderModal(false);
            setReminderLeadId(null);
            setReminderCallback(null);
          }, 100);
        }}
        leadId={reminderLeadId || ""}
        assigneesOptions={getUsersFromAgents(agents)}
        onSuccess={() => {
          // Execute callback if provided (for status changes requiring reminders)
          if (reminderCallback) {
            setTimeout(() => {
              reminderCallback();
            }, 200);
          }

          // Show success message
          Toast.show("Reminder added successfully", {
            duration: Toast.durations.SHORT,
          });

          // Close modal with delay to prevent view registration conflicts
          ModalManager.unregisterModal("reminder-modal");
          setTimeout(() => {
            setShowReminderModal(false);
            setReminderLeadId(null);
            setReminderCallback(null);
          }, 300);
        }}
      />

      {/* Meeting Modal */}
      <MeetingModal
        visible={showMeetingModal}
        onClose={() => {
          ModalManager.unregisterModal("meeting-modal");
          setTimeout(() => {
            setShowMeetingModal(false);
            setMeetingLeadId(null);
            setMeetingCallback(null);
          }, 100);
        }}
        leadId={meetingLeadId || ""}
        assigneeOptions={getUsersFromAgents(agents)}
        statusOptions={statusOptions}
        onSuccess={() => {
          // Execute callback if provided (for status changes requiring meetings)
          if (meetingCallback) {
            setTimeout(() => {
              meetingCallback();
            }, 200);
          }

          // Show success message
          Toast.show("Meeting scheduled successfully", {
            duration: Toast.durations.SHORT,
          });

          // Close modal with delay to prevent view registration conflicts
          ModalManager.unregisterModal("meeting-modal");
          setTimeout(() => {
            setShowMeetingModal(false);
            setMeetingLeadId(null);
            setMeetingCallback(null);
          }, 300);
        }}
      />

      {/* Bulk Modal */}
      <BulkModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedLeads={selectedLeads}
        onBulkOperationComplete={handleBulkOperationComplete}
        statusOptions={statusOptions}
        sourceOptions={sourceOptions}
        agents={getFlattenedAgents(agents)}
        tagOptions={tagOptions || []}
        currentUser={user}
      />
    </View>
  );
}
