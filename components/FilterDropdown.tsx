import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  onFetchOptions?: () => Promise<FilterOption[]>;
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
  const [searchText, setSearchText] = useState('');
  const [localOptions, setLocalOptions] = useState<FilterOption[]>(options);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Update localOptions when options prop changes
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  // Handle lazy loading when modal opens
  const handleOpenModal = async () => {
    setIsOpen(true);
    
    if (lazyLoad && onFetchOptions && !hasLoadedOnce && localOptions.length === 0) {
      setLoading(true);
      try {
        const fetchedOptions = await onFetchOptions();
        setLocalOptions(fetchedOptions);
        setHasLoadedOnce(true);
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const currentOptions = lazyLoad ? localOptions : options;
  const filteredOptions = currentOptions.filter(option =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const isAllSelected = selectedValues.length === currentOptions.length;
  const isPartiallySelected = selectedValues.length > 0 && selectedValues.length < currentOptions.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(currentOptions.map(option => option.value));
    }
  };

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find(o => o.value === selectedValues[0]);
      return option?.label || placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={handleOpenModal}
      >
        <Text style={styles.dropdownText}>{getDisplayText()}</Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search options..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={styles.selectAllContainer}>
            <TouchableOpacity 
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <View style={[
                styles.checkbox,
                isAllSelected && styles.checkboxSelected,
                isPartiallySelected && styles.checkboxPartial,
              ]}>
                {isAllSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                {isPartiallySelected && <View style={styles.partialIndicator} />}
              </View>
              <Text style={styles.selectAllText}>
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading options...</Text>
              </View>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.optionRow}
                    onPress={() => handleToggleOption(option.value)}
                  >
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                    
                    <View style={styles.optionContent}>
                      <Text style={styles.optionText}>{option.label}</Text>
                      {showColors && option.color && (
                        <View style={[
                          styles.colorIndicator,
                          { backgroundColor: option.color }
                        ]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  selectAllContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 16,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 12,
  },
  optionsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxPartial: {
    backgroundColor: '#F3F4F6',
    borderColor: '#3B82F6',
  },
  partialIndicator: {
    width: 8,
    height: 2,
    backgroundColor: '#3B82F6',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});
