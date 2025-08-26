import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FilterDropdown from './FilterDropdown';
import TreeSelect from './TreeSelect';

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
    { value: 'LeadIntroduction', label: 'Date for lead introduction' },
    {
      value: 'LeadAssignment',
      label: 'Date for agent assignment to lead',
      disabled: localFilters.selectedAgents.length === 0 || !localFilters.dateRange[0] || !localFilters.dateRange[1],
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
      searchTerm: '',
      searchBoxFilters: searchBoxOptions.length > 0 ? [searchBoxOptions[0].value] : [],
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
    setLocalFilters(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray,
      };
    });
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, isStartDate: boolean) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }
    
    if (selectedDate) {
      setLocalFilters(prev => {
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

  const FilterSection = ({ title, options, field }: { title: string; options: FilterOption[]; field: string }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = (localFilters[field] as string[]).includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionChip,
                isSelected && styles.selectedChip,
                option.color && !isSelected && { borderColor: option.color },
                option.color && isSelected && { backgroundColor: option.color, borderColor: option.color },
              ]}
              onPress={() => toggleSelection(field, option.value)}
            >
              <Text style={[styles.optionText, isSelected && styles.selectedText]}>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Search</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search leads..."
              value={localFilters.searchTerm}
              onChangeText={(text) => setLocalFilters(prev => ({ ...prev, searchTerm: text }))}
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
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Agents</Text>
              <TreeSelect
                title="Select Agents"
                treeData={agents}
                selectedValues={localFilters.selectedAgents}
                onSelectionChange={(values) => 
                  setLocalFilters(prev => ({ ...prev, selectedAgents: values }))
                }
                placeholder="Select agents..."
              />
            </View>
          )}


          {/* Status - Multi-select Dropdown */}
          {statusOptions.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Status</Text>
              <FilterDropdown
                title="Select Status"
                options={statusOptions}
                selectedValues={localFilters.selectedStatuses}
                onSelectionChange={(values) => 
                  setLocalFilters(prev => ({ ...prev, selectedStatuses: values }))
                }
                placeholder="Select status..."
                showColors={true}
              />
            </View>
          )}

          {/* Sources - Multi-select Dropdown */}
          {sourceOptions.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Sources</Text>
              <FilterDropdown
                title="Select Sources"
                options={sourceOptions}
                selectedValues={localFilters.selectedSources}
                onSelectionChange={(values) => 
                  setLocalFilters(prev => ({ ...prev, selectedSources: values }))
                }
                placeholder="Select sources..."
                showColors={false}
              />
            </View>
          )}

          {/* Tags - Multi-select Dropdown with lazy loading */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <FilterDropdown
              title="Select Tags"
              options={tagOptions}
              selectedValues={localFilters.selectedTags}
              onSelectionChange={(values) => 
                setLocalFilters(prev => ({ ...prev, selectedTags: values }))
              }
              placeholder="Select tags..."
              showColors={false}
              onFetchOptions={onFetchTags}
              lazyLoad={true}
            />
          </View>

          {/* Date Range - Simplified for now */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.dateContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Start Date:</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="DD/MM/YYYY"
                  value={localFilters.dateRange[0] ? localFilters.dateRange[0].toLocaleDateString() : ''}
                  onChangeText={(text) => {
                    const date = text ? new Date(text) : null;
                    if (date && !isNaN(date.getTime())) {
                      setLocalFilters(prev => ({
                        ...prev,
                        dateRange: [date, prev.dateRange[1]]
                      }));
                    }
                  }}
                />
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>End Date:</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="DD/MM/YYYY"
                  value={localFilters.dateRange[1] ? localFilters.dateRange[1].toLocaleDateString() : ''}
                  onChangeText={(text) => {
                    const date = text ? new Date(text) : null;
                    if (date && !isNaN(date.getTime())) {
                      setLocalFilters(prev => ({
                        ...prev,
                        dateRange: [prev.dateRange[0], date]
                      }));
                    }
                  }}
                />
              </View>
            </View>
          </View>

          {/* Date For */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Date For</Text>
            <View style={styles.radioContainer}>
              {dateForOptions.map((option) => {
                const isSelected = localFilters.dateFor === option.value;
                const isDisabled = option.disabled;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioOption,
                      isDisabled && styles.disabledOption,
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        setLocalFilters(prev => ({ ...prev, dateFor: option.value }));
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <View style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                      isDisabled && styles.disabledRadio,
                    ]} />
                    <Text style={[
                      styles.radioText,
                      isDisabled && styles.disabledText,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Results Per Page */}
          {countOptions.length > 0 && leadsData && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Results Per Page</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                {countOptions.map((option) => {
                  const isSelected = leadsData.leadsPerPage.toString() === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        isSelected && styles.selectedChip,
                      ]}
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
                      <Text style={[styles.optionText, isSelected && styles.selectedText]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  radioContainer: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  disabledOption: {
    opacity: 0.5,
  },
  disabledRadio: {
    borderColor: '#9CA3AF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#3B82F6',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  toggleText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
});
