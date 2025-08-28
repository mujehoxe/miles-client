import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FilterDropdown from "./FilterDropdown";
import TreeSelect from "./TreeSelect";

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    searchTerm: string;
    searchBoxFilters: string[];
    selectedAgents: string[];
    selectedStatuses: string[];
    selectedSources: string[];
    selectedTags: string[];
    dateRange: [Date | null, Date | null];
    dateFor: string;
  };
  onFiltersChange: (filters: any) => void;
  onLeadsDataChange: (data: any) => void;
  statusOptions: FilterOption[];
  sourceOptions: FilterOption[];
  tagOptions: FilterOption[];
  agents: FilterOption[];
  searchBoxOptions: FilterOption[];
  countOptions: FilterOption[];
  leadsData: {
    leadsPerPage: number;
    currentPage: number;
  };
  onFetchTags?: () => Promise<FilterOption[]>;
}

export default function FiltersModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onLeadsDataChange,
  statusOptions = [],
  sourceOptions = [],
  tagOptions = [],
  agents = [],
  searchBoxOptions = [],
  countOptions = [],
  leadsData,
  onFetchTags,
}: FilterProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const dateForOptions = [
    { value: "LeadIntroduction", label: "Date for lead introduction" },
    {
      value: "LeadAssignment",
      label: "Date for agent assignment to lead",
      disabled:
        localFilters.selectedAgents.length === 0 ||
        !localFilters.dateRange[0] ||
        !localFilters.dateRange[1],
    },
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      searchBoxFilters:
        searchBoxOptions.length > 0 ? [searchBoxOptions[0].value] : [],
      selectedAgents: [],
      selectedStatuses: [],
      selectedSources: [],
      selectedTags: [],
      dateRange: [null, null],
      dateFor: dateForOptions[0].value,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toggleSelection = (field: string, value: string) => {
    setLocalFilters((prev) => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [field]: newArray,
      };
    });
  };

  const handleDateChange = (
    event: any,
    selectedDate: Date | undefined,
    isStartDate: boolean
  ) => {
    if (Platform.OS === "android") {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      setLocalFilters((prev) => {
        const newRange: [Date | null, Date | null] = [...prev.dateRange];
        if (isStartDate) {
          newRange[0] = selectedDate;
        } else {
          newRange[1] = selectedDate;
        }
        return {
          ...prev,
          dateRange: newRange,
        };
      });
    }
  };

  const FilterSection = ({
    title,
    options,
    field,
  }: {
    title: string;
    options: FilterOption[];
    field: string;
  }) => (
    <View className="mb-6">
      <Text className="text-base font-semibold mb-3">{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {options.map((option) => {
          const isSelected = (localFilters[field] as string[]).includes(
            option.value
          );
          return (
            <TouchableOpacity
              key={option.value}
              className={`px-3 py-2 mr-2 bg-white border rounded-2xl min-w-[60px] items-center ${
                isSelected ? "bg-miles-500 border-miles-500" : "border-gray-300"
              }`}
              style={[
                option.color && !isSelected && { borderColor: option.color },
                option.color &&
                  isSelected && {
                    backgroundColor: option.color,
                    borderColor: option.color,
                  },
              ]}
              onPress={() => toggleSelection(field, option.value)}
            >
              <Text
                className={`text-sm ${
                  isSelected ? "text-white font-medium" : "text-gray-500"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Filters</Text>
          <TouchableOpacity onPress={handleClearFilters} className="p-1">
            <Text className="text-red-500 text-base font-medium">Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              Search
            </Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg p-3 text-base"
              placeholder="Search leads..."
              value={localFilters.searchTerm}
              onChangeText={(text) =>
                setLocalFilters((prev) => ({ ...prev, searchTerm: text }))
              }
            />
          </View>

          {/* Search Box Filters */}
          {searchBoxOptions.length > 0 && (
            <FilterSection
              title="Search Fields"
              options={searchBoxOptions}
              field="searchBoxFilters"
            />
          )}

          {/* Agents - TreeSelect */}
          {agents.length > 0 && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-700 mb-3">
                Agents
              </Text>
              <TreeSelect
                title="Select Agents"
                treeData={agents}
                selectedValues={localFilters.selectedAgents}
                onSelectionChange={(values) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    selectedAgents: values,
                  }))
                }
                placeholder="Select agents..."
              />
            </View>
          )}

          {/* Status - Multi-select Dropdown */}
          {statusOptions.length > 0 && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-700 mb-3">
                Status
              </Text>
              <FilterDropdown
                title="Select Status"
                options={statusOptions}
                selectedValues={localFilters.selectedStatuses}
                onSelectionChange={(values) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    selectedStatuses: values,
                  }))
                }
                placeholder="Select status..."
                showColors={true}
              />
            </View>
          )}

          {/* Sources - Multi-select Dropdown */}
          {sourceOptions.length > 0 && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-700 mb-3">
                Sources
              </Text>
              <FilterDropdown
                title="Select Sources"
                options={sourceOptions}
                selectedValues={localFilters.selectedSources}
                onSelectionChange={(values) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    selectedSources: values,
                  }))
                }
                placeholder="Select sources..."
                showColors={false}
              />
            </View>
          )}

          {/* Tags - Multi-select Dropdown with lazy loading */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              Tags
            </Text>
            <FilterDropdown
              title="Select Tags"
              options={tagOptions}
              selectedValues={localFilters.selectedTags}
              onSelectionChange={(values) =>
                setLocalFilters((prev) => ({ ...prev, selectedTags: values }))
              }
              placeholder="Select tags..."
              showColors={false}
              onFetchOptions={onFetchTags}
              lazyLoad={true}
            />
          </View>

          {/* Date Range - Simplified for now */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              Date Range
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Start Date:
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="DD/MM/YYYY"
                  value={
                    localFilters.dateRange[0]
                      ? localFilters.dateRange[0].toLocaleDateString()
                      : ""
                  }
                  onChangeText={(text) => {
                    const date = text ? new Date(text) : null;
                    if (date && !isNaN(date.getTime())) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        dateRange: [date, prev.dateRange[1]],
                      }));
                    }
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  End Date:
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="DD/MM/YYYY"
                  value={
                    localFilters.dateRange[1]
                      ? localFilters.dateRange[1].toLocaleDateString()
                      : ""
                  }
                  onChangeText={(text) => {
                    const date = text ? new Date(text) : null;
                    if (date && !isNaN(date.getTime())) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        dateRange: [prev.dateRange[0], date],
                      }));
                    }
                  }}
                />
              </View>
            </View>
          </View>

          {/* Date For */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              Date For
            </Text>
            <View className="gap-3">
              {dateForOptions.map((option) => {
                const isSelected = localFilters.dateFor === option.value;
                const isDisabled = option.disabled;
                return (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-row items-center py-2 gap-3 ${
                      isDisabled ? "opacity-50" : ""
                    }`}
                    onPress={() => {
                      if (!isDisabled) {
                        setLocalFilters((prev) => ({
                          ...prev,
                          dateFor: option.value,
                        }));
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 bg-white ${
                        isSelected
                          ? "border-miles-500 text-miles-500"
                          : isDisabled
                          ? "border-gray-400"
                          : "border-gray-300"
                      }`}
                    />
                    <Text
                      className={`text-base flex-1 ${
                        isDisabled ? "text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Results Per Page */}
          {countOptions.length > 0 && leadsData && (
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-700 mb-3">
                Results Per Page
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {countOptions.map((option) => {
                  const isSelected =
                    leadsData.leadsPerPage.toString() === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-3 py-2 mr-2 bg-white border rounded-2xl min-w-[60px] items-center ${
                        isSelected
                          ? "bg-miles-500 border-miles-500"
                          : "border-gray-300"
                      }`}
                      onPress={() => {
                        if (onLeadsDataChange) {
                          onLeadsDataChange({
                            ...leadsData,
                            leadsPerPage: parseInt(option.value, 10),
                            currentPage: 1,
                          });
                        }
                      }}
                    >
                      <Text
                        className={`text-sm ${
                          isSelected
                            ? "text-white font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="bg-miles-500 rounded-lg p-4 items-center"
            onPress={handleApplyFilters}
          >
            <Text className="text-white text-base font-semibold">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
