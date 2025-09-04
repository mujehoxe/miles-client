import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface DropdownOption {
  value: string;
  label: string;
  adsCount?: number;
}

interface SearchableDropdownProps {
  options?: DropdownOption[];
  data?: DropdownOption[]; // Support both options and data props
  value?: string;
  placeholder?: string;
  onSelect: (option: DropdownOption | null) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  allowClear?: boolean;
  className?: string;
  // Multi-select support
  multiSelect?: boolean;
  selectedItems?: DropdownOption[];
  defaultValue?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options = [],
  data = [],
  value,
  placeholder = "Select an option",
  onSelect,
  onSearch,
  loading = false,
  allowClear = false,
  className = "",
  multiSelect = false,
  selectedItems = [],
  defaultValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use data prop if provided, otherwise fallback to options
  const dropdownOptions = data.length > 0 ? data : options;

  // Update display value when value prop changes
  useEffect(() => {
    const valueToUse = value || defaultValue;
    if (valueToUse) {
      const selectedOption = dropdownOptions.find(
        (opt) => opt.value === valueToUse
      );
      setDisplayValue(selectedOption?.label || valueToUse);
    } else if (multiSelect && selectedItems.length > 0) {
      if (selectedItems.length === 1) {
        setDisplayValue(selectedItems[0].label);
      } else if (selectedItems.length <= 3) {
        setDisplayValue(selectedItems.map((item) => item.label).join(", "));
      } else {
        setDisplayValue(`${selectedItems.length} tags selected`);
      }
    } else {
      setDisplayValue("");
    }
  }, [value, defaultValue, dropdownOptions, multiSelect, selectedItems]);

  // Handle search with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(text);
      }
    }, 500); // 500ms debounce
  };

  // Handle option selection
  const handleOptionSelect = (option: DropdownOption) => {
    if (multiSelect) {
      // In multi-select mode, don't close modal, just call onSelect
      onSelect(option);
      setSearchQuery(""); // Clear search but keep modal open
    } else {
      // Single select mode - close modal
      setDisplayValue(option.label);
      setSearchQuery("");
      setIsOpen(false);
      onSelect(option);
      Keyboard.dismiss();
    }
  };

  // Handle multi-select modal close
  const handleMultiSelectDone = () => {
    setIsOpen(false);
    setSearchQuery("");
    Keyboard.dismiss();
  };

  // Handle clear selection
  const handleClear = () => {
    setDisplayValue("");
    setSearchQuery("");
    onSelect(null);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    Keyboard.dismiss();
  };

  // Filter options based on search query (client-side filtering for fallback)
  const filteredOptions = dropdownOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Main Input Field */}
      <TouchableOpacity
        className={`bg-white border border-gray-300 rounded-lg p-3 flex-row items-center justify-between ${className}`}
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={`text-base flex-1 ${
            displayValue ? "text-gray-900" : "text-gray-400"
          }`}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <View className="flex-row items-center">
          {allowClear && displayValue && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 mr-2"
            >
              <Ionicons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </View>
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleModalClose}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <TouchableOpacity
              onPress={multiSelect ? handleMultiSelectDone : handleModalClose}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              {multiSelect
                ? `Select Tags (${selectedItems.length})`
                : "Search Options"}
            </Text>

            <View className="w-6" />
          </View>

          {/* Search Input */}
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
              <Ionicons
                name="search"
                size={20}
                color="#6B7280"
                className="mr-2"
              />
              <TextInput
                className="flex-1 text-base text-gray-800 py-3"
                placeholder="Type to search..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
                returnKeyType="search"
              />
              {loading && (
                <ActivityIndicator
                  size="small"
                  color="#6B7280"
                  className="ml-2"
                />
              )}
            </View>
          </View>

          {/* Options List */}
          <ScrollView className="flex-1">
            {loading && filteredOptions.length === 0 && searchQuery ? (
              <View className="p-4 items-center">
                <ActivityIndicator size="large" color="#176298" />
                <Text className="text-gray-500 mt-2">Searching...</Text>
              </View>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                // Check if option is selected (for both single and multi-select)
                const isSelected = multiSelect
                  ? selectedItems.some((item) => item.value === option.value)
                  : value === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    className={`p-4 border-b border-gray-100 flex-row items-center justify-between ${
                      isSelected ? "bg-miles-50" : ""
                    }`}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <View className="flex-1">
                      <Text className="text-base text-gray-900 font-medium">
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#176298" />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="p-4 items-center">
                <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2 text-center">
                  {searchQuery ? "No results found" : "Start typing to search"}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Clear Option */}
          {allowClear && (
            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                className="bg-gray-100 rounded-lg p-3 items-center"
                onPress={() => {
                  handleClear();
                  setIsOpen(false);
                }}
              >
                <Text className="text-gray-700 font-medium">
                  Clear Selection
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

export default SearchableDropdown;
