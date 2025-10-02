import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SourceOption {
  value: string;
  label: string;
}

interface SourcePickerProps {
  value: string;
  options: SourceOption[];
  onValueChange: (value: string, option: SourceOption) => void;
  disabled?: boolean;
}

const SourcePicker: React.FC<SourcePickerProps> = ({
  value,
  options,
  onValueChange,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  
  const selectedOption = options.find(opt => opt.value === value);
  
  const handleSelect = (option: SourceOption) => {
    onValueChange(option.value, option);
    setIsVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          if (!disabled) setIsVisible(true);
        }}
        disabled={disabled}
        className={`bg-white border border-gray-300 rounded-lg p-2 flex-row items-center justify-between ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <Text className="text-sm font-medium text-gray-900 flex-1">
          {selectedOption?.label || 'Select Source'}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color="#6B7280" 
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <TouchableOpacity onPress={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Select Source
            </Text>
            <View className="w-6" />
          </View>
          
          <ScrollView className="flex-1">
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={(e) => {
                  e.stopPropagation();
                  handleSelect(option);
                }}
                className={`flex-row items-center p-4 border-b border-gray-100 ${
                  option.value === value ? 'bg-miles-50' : ''
                }`}
              >
                <Text className="text-base text-gray-900 flex-1">
                  {option.label}
                </Text>
                {option.value === value && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default SourcePicker;
