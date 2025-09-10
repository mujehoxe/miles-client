import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { LeadType } from "../LeadTypeDropdown";

interface LeadTypeModalProps {
  visible: boolean;
  selectedType: LeadType;
  onClose: () => void;
  onTypeChange: (type: LeadType) => void;
}

const LEAD_TYPE_OPTIONS = [
  {
    value: "community" as LeadType,
    label: "Community",
  },
  {
    value: "marketing" as LeadType,
    label: "Marketing",
  },
];

export default function LeadTypeModal({
  visible,
  selectedType,
  onClose,
  onTypeChange,
}: LeadTypeModalProps) {
  const handleOptionSelect = (type: LeadType) => {
    onTypeChange(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/20" onPress={onClose}>
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
                <TouchableOpacity onPress={onClose} className="p-1">
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
                      isSelected ? "bg-miles-50" : ""
                    }`}
                    onPress={() => handleOptionSelect(option.value)}
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        className={`text-base font-medium ${
                          isSelected ? "text-miles-700" : "text-gray-800"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#059669" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
