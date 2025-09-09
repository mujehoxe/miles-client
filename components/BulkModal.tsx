import { bulkUpdateLeads, fetchTagOptions } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";
import MultiSelectModal from "./MultiSelectModal";
import SearchableDropdown from "./SearchableDropdown";

interface BulkModalProps {
  visible: boolean;
  onClose: () => void;
  selectedLeads: any[];
  onBulkOperationComplete: () => void;
  statusOptions: any[];
  sourceOptions: any[];
  agents: any[];
  tagOptions: any[];
  currentUser?: any;
}

interface BulkData {
  status: { value: string; label: string } | null;
  source: { value: string; label: string } | null;
  assignee: { value: string; label: string } | null;
  description: string;
  hideData: boolean;
  forceReassign: boolean;
  replaceDescription: boolean;
  tags: string[];
  addTags: boolean;
  removeTags: boolean;
}

const BulkModal: React.FC<BulkModalProps> = ({
  visible,
  onClose,
  selectedLeads,
  onBulkOperationComplete,
  statusOptions,
  sourceOptions,
  agents,
  tagOptions: initialTagOptions,
  currentUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [bulkData, setBulkData] = useState<BulkData>({
    status: null,
    source: null,
    assignee: null,
    description: "",
    hideData: false,
    forceReassign: false,
    replaceDescription: false,
    tags: [],
    addTags: false,
    removeTags: false,
  });

  const [description, setDescription] = useState("");
  const [skippedLeads, setSkippedLeads] = useState<any[] | null>(null);
  const [selfAssignWarning, setSelfAssignWarning] = useState(false);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [tagOptions, setTagOptions] = useState(initialTagOptions || []);

  // Update local tag options when initialTagOptions change
  useEffect(() => {
    if (initialTagOptions && initialTagOptions.length > 0) {
            setTagOptions(initialTagOptions);
    }
  }, [initialTagOptions]);

  // Check if the selected leads have existing assignments
  const hasAssignedLeads = useMemo(() => {
    return selectedLeads.some((lead) => lead.Assigned && lead.Assigned._id);
  }, [selectedLeads]);

  // Filter out the current user from agents dropdown options when user has a sales role
  const filteredAgents = useMemo(() => {
    if (!currentUser) return agents;

    // Check if user has a sales role
    let isSalesRole = false;

    if (
      currentUser.roleRef &&
      typeof currentUser.roleRef.isSalesRole === "boolean"
    ) {
      isSalesRole = currentUser.roleRef.isSalesRole;
    } else if (currentUser.role || currentUser.Role) {
      const salesRoles = ["FOS", "ATL", "TL", "PNL", "BusinessHead"];
      const userRole = (
        currentUser.role ||
        currentUser.Role ||
        ""
      ).toLowerCase();
      isSalesRole = salesRoles.some((role) => userRole === role.toLowerCase());
    }

    // Remove current user from options if they have a sales role
    if (isSalesRole) {
      return agents.filter(
        (agent) =>
          agent.value !== currentUser.id && agent.value !== currentUser._id
      );
    }

    return agents;
  }, [agents, currentUser]);

  // Debug options data
  useEffect(() => {
        if (initialTagOptions && initialTagOptions.length > 0) {
          }
  }, [
    statusOptions,
    sourceOptions,
    agents,
    initialTagOptions,
    tagOptions,
    visible,
  ]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setBulkData({
        status: null,
        source: null,
        assignee: null,
        description: "",
        hideData: false,
        forceReassign: false,
        replaceDescription: false,
        tags: [],
        addTags: false,
        removeTags: false,
      });
      setDescription("");
      setSkippedLeads(null);
      setSelfAssignWarning(false);
      setSelectedTags([]);
    }
  }, [visible]);

  // Handle form field changes
  const handleChange = useCallback(
    (field: string) => (value: any) => {
      if (field === "assignee") {
        const selectedAgent = agents.find((agent) => agent.value === value);

        // Check for self-assignment warning
        if (currentUser) {
          let isSalesRole = false;

          if (
            currentUser.roleRef &&
            typeof currentUser.roleRef.isSalesRole === "boolean"
          ) {
            isSalesRole = currentUser.roleRef.isSalesRole;
          } else if (currentUser.role || currentUser.Role) {
            const salesRoles = ["FOS", "ATL", "TL", "PNL", "BusinessHead"];
            const userRole = (
              currentUser.role ||
              currentUser.Role ||
              ""
            ).toLowerCase();
            isSalesRole = salesRoles.some(
              (role) => userRole === role.toLowerCase()
            );
          }

          if (
            isSalesRole &&
            (currentUser.id === value || currentUser._id === value)
          ) {
            setSelfAssignWarning(true);
          } else {
            setSelfAssignWarning(false);
          }
        }

        setBulkData((prev) => ({
          ...prev,
          [field]: selectedAgent
            ? {
                value: selectedAgent.value,
                label: selectedAgent.label,
              }
            : null,
        }));
      } else if (field === "status") {
        const selectedStatus = statusOptions.find(
          (status) => status.value === value
        );
        setBulkData((prev) => ({
          ...prev,
          [field]: selectedStatus
            ? {
                value: selectedStatus.value,
                label: selectedStatus.label,
              }
            : null,
        }));
      } else if (field === "source") {
        const selectedSource = sourceOptions.find(
          (source) => source.value === value
        );
        setBulkData((prev) => ({
          ...prev,
          [field]: selectedSource
            ? {
                value: selectedSource.value,
                label: selectedSource.label,
              }
            : null,
        }));
      } else if (field === "tags") {
        const processedTags = (value || []).map((tagValue: any) => {
          if (typeof tagValue === "string" && tagValue.includes("::")) {
            const parts = tagValue.split("::");
            return parts[1]; // Extract ObjectId after "::"
          } else if (typeof tagValue === "object" && tagValue.value) {
            return tagValue.value;
          } else {
            return tagValue;
          }
        });

        setSelectedTags(value || []);
        setBulkData((prev) => ({
          ...prev,
          [field]: processedTags,
        }));
      } else {
        setBulkData((prev) => ({ ...prev, [field]: value }));
      }
    },
    [agents, statusOptions, sourceOptions, currentUser]
  );

  // Toggle boolean fields
  const toggleBooleanField = useCallback(
    (field: keyof BulkData) => () => {
      setBulkData((prev) => ({ ...prev, [field]: !prev[field] }));
    },
    []
  );

  // Perform bulk action
  const doBulkAction = async (leads: any[], bulkDataParam: BulkData) => {
    try {
      const leadIds = leads.map((lead) => lead._id);

      const body: any = {
        leads: leadIds,
        ...bulkDataParam,
      };

      // Include description when replaceDescription is true or when non-empty
      if (bulkDataParam.replaceDescription || description !== "") {
        body.description = description;
      }

      // Include tags if there are any selected
      if (bulkDataParam.tags && bulkDataParam.tags.length > 0) {
        body.tags = bulkDataParam.tags;
        body.addTags = bulkDataParam.addTags;
        body.removeTags = bulkDataParam.removeTags;
      }

      // Make actual API call
      const response = await bulkUpdateLeads(body);

      // Handle skipped leads if any
      if (response.skippedLeads && response.skippedLeads.length > 0) {
        setSkippedLeads(response.skippedLeads);
        Toast.show(
          `Bulk operation completed with ${response.skippedLeads.length} skipped leads`,
          {
            duration: Toast.durations.LONG,
          }
        );
      } else {
        Toast.show("Bulk operation completed successfully", {
          duration: Toast.durations.SHORT,
        });

        onBulkOperationComplete();
        onClose();
      }
    } catch (error) {
      console.error(error);
      throw new Error("Error updating leads: " + (error.message || error));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate tags operations
    if (selectedTags.length > 0 && !bulkData.addTags && !bulkData.removeTags) {
      Toast.show(
        'Please select either "Add" or "Remove" option for tag operations',
        {
          duration: Toast.durations.LONG,
        }
      );
      return;
    }

    setLoading(true);
    try {
      const updatedBulkData = {
        ...bulkData,
        description: description,
      };

      await doBulkAction(selectedLeads, updatedBulkData);
    } catch (err) {
      console.error({
        duration: Toast.durations.LONG,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if submit button should be disabled
  const isSubmitDisabled =
    loading ||
    selfAssignWarning ||
    (selectedTags.length > 0 && !bulkData.addTags && !bulkData.removeTags);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-gray-900">
              Bulk Actions
            </Text>
            {loading && <ActivityIndicator size="small" color="#176298" />}
          </View>
          <View className="w-6" />
          {/* Spacer for center alignment */}
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="gap-6">
            {/* Status Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Status
              </Text>
              <SearchableDropdown
                data={statusOptions}
                onSelect={(item) => handleChange("status")(item?.value)}
                placeholder="Change Status..."
                value={bulkData.status?.value}
                defaultValue={
                  selectedLeads.length === 1
                    ? selectedLeads[0].LeadStatus?._id
                    : undefined
                }
              />
            </View>

            {/* Source Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Source
              </Text>
              <SearchableDropdown
                data={sourceOptions}
                onSelect={(item) => handleChange("source")(item?.value)}
                placeholder="Change Source..."
                value={bulkData.source?.value}
                defaultValue={
                  selectedLeads.length === 1
                    ? selectedLeads[0]?.Source?._id
                    : undefined
                }
              />
            </View>

            {/* Assignee Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Assigned
              </Text>
              <SearchableDropdown
                data={filteredAgents}
                onSelect={(item) => handleChange("assignee")(item?.value)}
                placeholder="Assign..."
                value={bulkData.assignee?.value}
                defaultValue={
                  selectedLeads.length === 1
                    ? selectedLeads[0].Assigned?._id
                    : undefined
                }
              />
              {selfAssignWarning && (
                <View className="mt-2 flex-row items-center bg-amber-50 p-3 rounded-lg">
                  <Ionicons name="warning-outline" size={16} color="#D97706" />
                  <Text className="ml-2 text-sm text-amber-700">
                    Sales users cannot reassign leads to themselves
                  </Text>
                </View>
              )}
            </View>

            {/* Tags Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Tags
              </Text>
              <MultiSelectModal
                title="Tags"
                options={tagOptions}
                selectedValues={selectedTags.map((tag) => tag.value)}
                onSelectionChange={(selectedValues) => {
                  // Convert selected values back to tag objects
                  const newSelectedTags = selectedValues.map((value) => {
                    const foundTag = tagOptions.find(
                      (tag) => tag.value === value
                    );
                    return foundTag || { value, label: value };
                  });
                  handleChange("tags")(newSelectedTags);
                }}
                placeholder="Add/Remove tags..."
                showColors={false}
                lazyLoad={true}
                onFetchOptions={async (page, search) => {
                  if (!search || search.length < 2) {
                    return {
                      options: initialTagOptions || [],
                      hasMore: false,
                      totalCount: initialTagOptions?.length || 0,
                    };
                  }

                  try {
                    const searchResponse = await fetchTagOptions(
                      page,
                      50,
                      search
                    );
                    const formattedResults = searchResponse.options.map(
                      (tag: any) => ({
                        value: `${tag.label}::${
                          tag.value.split("::")[1] || tag.value
                        }`,
                        label: tag.label,
                      })
                    );

                    return {
                      options: formattedResults,
                      hasMore: searchResponse.hasMore,
                      totalCount: searchResponse.totalCount,
                    };
                  } catch (error) {
                    console.error(error);
                    return {
                      options: initialTagOptions || [],
                      hasMore: false,
                      totalCount: initialTagOptions?.length || 0,
                    };
                  }
                }}
              />

              {/* Tag Action Checkboxes */}
              <View className="flex-row gap-6 mt-3">
                <TouchableOpacity
                  onPress={toggleBooleanField("addTags")}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className={`w-4 h-4 rounded border-2 items-center justify-center ${
                      bulkData.addTags
                        ? "bg-miles-600 border-miles-600"
                        : "border-gray-300"
                    }`}
                  >
                    {bulkData.addTags && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="text-sm text-miles-600">
                    Add selected tags
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleBooleanField("removeTags")}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className={`w-4 h-4 rounded border-2 items-center justify-center ${
                      bulkData.removeTags
                        ? "bg-red-600 border-red-600"
                        : "border-gray-300"
                    }`}
                  >
                    {bulkData.removeTags && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="text-sm text-red-600">
                    Remove selected tags
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tag Validation Warning */}
              {selectedTags.length > 0 &&
                !bulkData.addTags &&
                !bulkData.removeTags && (
                  <View className="mt-2 flex-row items-center bg-amber-50 p-3 rounded-lg">
                    <Ionicons
                      name="warning-outline"
                      size={16}
                      color="#D97706"
                    />
                    <Text className="ml-2 text-xs text-amber-700">
                      Please select either "Add" or "Remove" option for tag
                      operations
                    </Text>
                  </View>
                )}
            </View>

            {/* Description Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Description
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base h-24"
                placeholder="Describe your changes"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                textAlignVertical="top"
              />

              <TouchableOpacity
                onPress={toggleBooleanField("replaceDescription")}
                className="flex-row items-center gap-2 mt-2"
              >
                <View
                  className={`w-4 h-4 rounded border-2 items-center justify-center ${
                    bulkData.replaceDescription
                      ? "bg-miles-600 border-miles-600"
                      : "border-gray-300"
                  }`}
                >
                  {bulkData.replaceDescription && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text className="text-sm text-gray-600">
                  Replace existing description
                </Text>
              </TouchableOpacity>
            </View>

            {/* Boolean Options */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={toggleBooleanField("hideData")}
                className="flex-row items-center gap-2"
              >
                <View
                  className={`w-4 h-4 rounded border-2 items-center justify-center ${
                    bulkData.hideData
                      ? "bg-red-600 border-red-600"
                      : "border-gray-300"
                  }`}
                >
                  {bulkData.hideData && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text className="text-sm text-red-600">
                  Hide Data (Comments, Reminders, Meetings)
                </Text>
              </TouchableOpacity>

              <View>
                <TouchableOpacity
                  onPress={toggleBooleanField("forceReassign")}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className={`w-4 h-4 rounded border-2 items-center justify-center ${
                      bulkData.forceReassign
                        ? "bg-amber-600 border-amber-600"
                        : "border-gray-300"
                    }`}
                  >
                    {bulkData.forceReassign && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="text-sm text-amber-600">Force Reassign</Text>
                </TouchableOpacity>

                <View className="flex-row items-center ml-6 mt-1">
                  <Ionicons
                    name="information-circle-outline"
                    size={12}
                    color="#9CA3AF"
                  />
                  <Text className="ml-1 text-xs text-gray-500">
                    Allows reassignment when leads have future meetings or
                    reminders
                  </Text>
                </View>
              </View>
            </View>

            {/* Skipped Leads Display */}
            {skippedLeads && (
              <View className="border border-amber-200 rounded-lg bg-amber-50 p-4">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-base font-medium text-amber-700">
                    Skipped Leads ({skippedLeads.length})
                  </Text>
                  <TouchableOpacity className="bg-miles-50 px-3 py-2 rounded-lg">
                    <Ionicons
                      name="download-outline"
                      size={16}
                      color="#176298"
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  className="max-h-32"
                  showsVerticalScrollIndicator={false}
                >
                  {skippedLeads.map((lead) => (
                    <Text
                      key={lead._id}
                      className="text-sm text-amber-700 mb-1"
                    >
                      {lead.Name} - {lead.reason}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer with Submit Button */}
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            className={`bg-miles-500 rounded-lg p-4 items-center ${
              isSubmitDisabled ? "opacity-50" : ""
            }`}
          >
            <Text className="text-white text-base font-semibold">
              {loading ? "Processing..." : "Submit Bulk Actions"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default BulkModal;
