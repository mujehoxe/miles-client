import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface LeadsHeaderProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  onFiltersPress: () => void;
  selectedLeads: any[];
  onClearSelection: () => void;
}

export default function LeadsHeader({
  searchTerm,
  onSearchChange,
  onFiltersPress,
  selectedLeads,
  onClearSelection,
}: LeadsHeaderProps) {
  return (
    <View className="bg-white px-4 pt-3 pb-4 border-b border-gray-200">
      <View className="flex-row items-center gap-3">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 h-11">
          <Ionicons name="search" size={20} color="#6B7280" className="mr-2" />
          <TextInput
            className="flex-1 text-base text-gray-800"
            placeholder="Search leads..."
            value={searchTerm}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          className="w-11 h-11 rounded-lg bg-gray-100 items-center justify-center"
          onPress={onFiltersPress}
        >
          <Ionicons name="filter" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {selectedLeads.length > 0 && (
        <View className="flex-row items-center justify-between mt-3 px-1">
          <Text className="text-sm font-medium text-miles-500">
            {selectedLeads.length} selected
          </Text>
          <TouchableOpacity className="py-1 px-2" onPress={onClearSelection}>
            <Text className="text-sm text-gray-500">Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
