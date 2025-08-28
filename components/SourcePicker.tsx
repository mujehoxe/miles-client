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
  
  // Debug logging (only if we have a value and options to reduce spam)
  if (value && options.length > 0) {
    console.log('SourcePicker Debug:', {
      value,
      optionsCount: options.length,
      firstFewOptions: options.slice(0, 2),
      selectedOption: selectedOption ? { value: selectedOption.value, label: selectedOption.label } : null
    });
  }
  
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
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-lg max-h-[70%]">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                Select Source
              </Text>
              <TouchableOpacity onPress={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="max-h-96">
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                  className={`flex-row items-center p-4 ${
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
        </View>
      </Modal>
    </>
  );
};

export default SourcePicker;
