import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  showColors?: boolean;
  lazyLoad?: boolean;
  onFetchOptions?: (
    page?: number,
    limit?: number,
    searchTerm?: string
  ) => Promise<{
    options: FilterOption[];
    hasMore: boolean;
    totalCount: number;
  }>;
}

export default function FilterDropdown({
  title,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select...",
  showColors = false,
  lazyLoad = false,
  onFetchOptions,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [localOptions, setLocalOptions] = useState<FilterOption[]>(options);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchDebounceTimer, setSearchDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Update localOptions when options prop changes
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  // Handle lazy loading when modal opens
  const handleOpenModal = async () => {
    setIsOpen(true);

    if (lazyLoad && onFetchOptions && !hasLoadedOnce)
      await loadInitialOptions();
  };

  // Load initial options
  const loadInitialOptions = async () => {
    if (!onFetchOptions) return;

    setLoading(true);
    try {
      const result = await onFetchOptions(1, 50, searchText);
      setLocalOptions(result.options);
      setHasMore(result.hasMore);
      setCurrentPage(1);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error("Error fetching initial options:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load more options for infinite scroll
  const loadMoreOptions = async () => {
    if (!onFetchOptions || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await onFetchOptions(nextPage, 50, searchText);
      setLocalOptions((prev) => [...prev, ...result.options]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more options:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle search with debouncing
  const handleSearch = async (text: string) => {
    setSearchText(text);

    if (!lazyLoad || !onFetchOptions) return;

    // Clear existing debounce timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await onFetchOptions(1, 50, text);
        setLocalOptions(result.options);
        setHasMore(result.hasMore);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error searching options:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    setSearchDebounceTimer(timer);
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const currentOptions = lazyLoad ? localOptions : options;
  const filteredOptions = currentOptions.filter((option) =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const isAllSelected = selectedValues.length === currentOptions.length;
  const isPartiallySelected =
    selectedValues.length > 0 && selectedValues.length < currentOptions.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(currentOptions.map((option) => option.value));
    }
  };

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find((o) => o.value === selectedValues[0]);
      return option?.label || placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <View className="mb-4">
      <TouchableOpacity
        className="flex-row items-center justify-between bg-white border border-gray-300 rounded-lg p-3 min-h-[48px]"
        onPress={handleOpenModal}
      >
        <Text className="text-base text-gray-700 flex-1">
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
            <View className="w-6" />
          </View>

          <View className="flex-row items-center bg-white border-b border-gray-200 px-4 py-3">
            <Ionicons
              name="search"
              size={20}
              color="#6B7280"
              className="mr-2"
            />
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="Search options..."
              value={searchText}
              onChangeText={lazyLoad ? handleSearch : setSearchText}
            />
          </View>

          <View className="bg-white border-b border-gray-200 p-4">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={handleSelectAll}
            >
              <View
                className={`w-5 h-5 rounded items-center align-middle justify-center ${
                  isAllSelected
                    ? "bg-miles-500"
                    : isPartiallySelected
                    ? "bg-gray-100 border-miles-500 border-2"
                    : "border-gray-300 border-2"
                }`}
              >
                {isAllSelected && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
                {isPartiallySelected && (
                  <View className="w-2 h-0.5 bg-miles-500" />
                )}
              </View>
              <Text className="text-base font-medium text-miles-500 ml-3">
                {isAllSelected ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 bg-white"
            onScroll={({ nativeEvent }) => {
              // Check if user has scrolled to bottom (with some buffer)
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;
              const paddingToBottom = 20;
              const isAtBottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;

              if (isAtBottom && lazyLoad) {
                loadMoreOptions();
              }
            }}
            scrollEventThrottle={400}
          >
            {loading ? (
              <View className="flex-1 justify-center items-center p-8">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-base text-gray-500">
                  Loading options...
                </Text>
              </View>
            ) : (
              <>
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      className="flex-row items-center p-4 border-b border-gray-100"
                      onPress={() => handleToggleOption(option.value)}
                    >
                      <View
                        className={`w-5 h-5 rounded items-center justify-center ${
                          isSelected
                            ? "bg-miles-500 border-miles-500"
                            : "border-gray-300 border-2"
                        }`}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        )}
                      </View>

                      <View className="flex-1 flex-row items-center justify-between ml-3">
                        <Text className="text-base text-gray-700">
                          {option.label}
                        </Text>
                        {showColors && option.color && (
                          <View
                            className="w-4 h-4 rounded-full ml-2"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Loading more indicator */}
                {loadingMore && (
                  <View className="flex-row items-center justify-center p-4 border-b border-gray-100">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text className="ml-2 text-sm text-gray-500">
                      Loading more...
                    </Text>
                  </View>
                )}

                {/* End of results indicator */}
                {lazyLoad && !hasMore && localOptions.length > 0 && (
                  <View className="items-center p-4 border-b border-gray-100">
                    <Text className="text-sm text-gray-400 italic">
                      No more options to load
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View className="p-4 bg-white border-t border-gray-200">
            <TouchableOpacity
              className="bg-miles-500 rounded-lg p-4 items-center"
              onPress={() => setIsOpen(false)}
            >
              <Text className="text-white text-base font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
