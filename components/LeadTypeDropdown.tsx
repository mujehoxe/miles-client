import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type LeadType = 'community' | 'marketing';

export interface LeadTypeOption {
  value: LeadType;
  label: string;
  description: string;
}

interface LeadTypeDropdownProps {
  selectedType: LeadType;
  onTypeChange: (type: LeadType) => void;
  disabled?: boolean;
}

const LEAD_TYPE_OPTIONS: LeadTypeOption[] = [
  {
    value: 'community',
    label: 'Community',
    description: 'Leads from community sources only',
  },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'All other marketing sources',
  },
];

export default function LeadTypeDropdown({
  selectedType,
  onTypeChange,
  disabled = false,
}: LeadTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = LEAD_TYPE_OPTIONS.find(
    option => option.value === selectedType
  );

  const handleOptionSelect = (type: LeadType) => {
    onTypeChange(type);
    setIsOpen(false);
  };

  return (
    <View className="relative">
      {/* Dropdown Trigger */}
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          paddingHorizontal: 8,
          paddingVertical: 4,
          minWidth: 100,
          opacity: disabled ? 0.5 : 1,
        }}
        onPress={() => {
          console.log('LeadTypeDropdown pressed, disabled:', disabled);
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        disabled={disabled}
      >
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600', 
          color: '#000000',
          marginRight: 4
        }} numberOfLines={1}>
          {selectedOption?.label || 'Select Type'}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={14} 
          color="#000000" 
        />
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black/20" 
          onPress={() => setIsOpen(false)}
        >
          <View className="flex-1 justify-center items-center p-4">
            <Pressable 
              className="bg-white rounded-lg shadow-lg w-full max-w-sm"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View className="px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-800">
                    Select Lead Type
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    className="p-1"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Options */}
              <View className="py-2">
                {LEAD_TYPE_OPTIONS.map((option) => {
                  const isSelected = selectedType === option.value;
                  
                  return (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-4 py-3 flex-row items-center justify-between ${
                        isSelected ? 'bg-miles-50' : ''
                      }`}
                      onPress={() => handleOptionSelect(option.value)}
                    >
                      <View className="flex-1 mr-3">
                        <Text 
                          className={`text-base font-medium ${
                            isSelected ? 'text-miles-700' : 'text-gray-800'
                          }`}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-sm text-gray-500 mt-0.5">
                          {option.description}
                        </Text>
                      </View>
                      
                      {isSelected && (
                        <Ionicons 
                          name="checkmark" 
                          size={20} 
                          color="#059669" 
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
