import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";

interface ActionButtonsProps {
  selectedLeads: any[];
  totalLeads: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onBulkActions?: () => void;
  onHistory?: () => void;
  onDealSubmission?: () => void;
  isExporting?: boolean;
  userPermissions?: {
    export?: boolean;
    delete?: boolean;
    mapLeads?: boolean;
  };
  className?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  selectedLeads = [],
  totalLeads = 0,
  onSelectAll,
  onClearSelection,
  onExport,
  onDelete,
  onBulkActions,
  isExporting = false,
  userPermissions = {},
  className = "",
}) => {
  const selectedCount = selectedLeads.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalLeads;

  const handleSelectAll = () => {
    if (isAllSelected) onClearSelection();
    else onSelectAll();
  };

  const handleDelete = () => {
    if (selectedCount === 0) {
      Toast.show("Please select leads to delete", {
        duration: Toast.durations.SHORT,
      });
      return;
    }

    Alert.alert(
      "Delete Leads",
      `Are you sure you want to delete ${selectedCount} lead${
        selectedCount > 1 ? "s" : ""
      }? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (onDelete) onDelete();
          },
        },
      ]
    );
  };

  const handleExport = () => {
    if (onExport) onExport();
  };

  const handleBulkActions = () => {
    if (selectedCount === 0) {
      Toast.show("Please select leads for bulk actions", {
        duration: Toast.durations.SHORT,
      });
      return;
    }

    if (onBulkActions) onBulkActions();
  };

  return (
    <View className={`bg-white border-t border-gray-200 ${className}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View className="flex-row gap-3">
          {/* Select All / Deselect All */}
          <TouchableOpacity
            onPress={handleSelectAll}
            className="flex-row items-center px-4 py-2 rounded-lg bg-miles-50 border border-miles-200"
          >
            <Ionicons
              name={isAllSelected ? "checkbox" : "checkbox-outline"}
              size={16}
              color="#176298"
              className="mr-2"
            />
            <Text className="text-sm font-medium text-miles-600">
              {isAllSelected ? "Deselect All" : "Select All"}
            </Text>
          </TouchableOpacity>

          {/* Bulk Actions */}
          {userPermissions.mapLeads && (
            <TouchableOpacity
              onPress={handleBulkActions}
              disabled={selectedCount === 0}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                selectedCount > 0
                  ? "bg-miles-50 border border-miles-200"
                  : "bg-gray-100 border border-gray-200"
              }`}
            >
              <Ionicons
                name="layers-outline"
                size={16}
                color={selectedCount > 0 ? "#176298" : "#9CA3AF"}
                className="mr-2"
              />
              <Text
                className={`text-sm font-medium ${
                  selectedCount > 0 ? "text-miles-600" : "text-gray-400"
                }`}
              >
                Bulk Actions
              </Text>
            </TouchableOpacity>
          )}

          {/* Export */}
          {userPermissions.export && (
            <TouchableOpacity
              onPress={handleExport}
              disabled={isExporting}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                isExporting
                  ? "bg-gray-100 border border-gray-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              {isExporting ? (
                <ActivityIndicator
                  size="small"
                  color="#9CA3AF"
                  className="mr-2"
                />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={16}
                  color="#059669"
                  className="mr-2"
                />
              )}
              <Text
                className={`text-sm font-medium ${
                  isExporting ? "text-gray-400" : "text-green-600"
                }`}
              >
                {isExporting ? "Exporting..." : "Export"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Selection Info */}
      {selectedCount > 0 && (
        <View className="px-4 pb-3">
          <View className="bg-miles-50 px-3 py-2 rounded-lg">
            <Text className="text-sm font-medium text-miles-700 text-center">
              {selectedCount} lead{selectedCount > 1 ? "s" : ""} selected
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default ActionButtons;
