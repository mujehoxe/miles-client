import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
interface StatusOption {
  value: string;
  label: string;
  color: string;
  requiresReminder?: "yes" | "no" | "optional";
}

interface StatusPickerProps {
  value: string;
  options: StatusOption[];
  onValueChange: (value: string, option: StatusOption) => void;
  disabled?: boolean;
}

const StatusPicker: React.FC<StatusPickerProps> = ({
  value,
  options,
  onValueChange,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);


  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option: StatusOption) => {
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
        className={`rounded-lg ${disabled ? "opacity-50" : ""}`}
        style={{
          backgroundColor: selectedOption?.color || "#E5E7EB",
          paddingBottom: 2,
        }}
      >
        <View className="bg-white rounded-md p-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: selectedOption?.color || "#6B7280" }}
            />
            <Text className="text-sm font-medium text-gray-900 flex-1">
              {selectedOption?.label || "Select Status"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Select Status
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
                  option.value === value ? "bg-miles-50" : ""
                }`}
              >
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: option.color }}
                />
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

export default StatusPicker;
