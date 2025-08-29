import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";

interface Lead {
  _id: string;
  Name: string;
  // Add other lead properties as needed
}

interface RemindersTabProps {
  lead: Lead;
}

const RemindersTab: React.FC<RemindersTabProps> = ({ lead }) => {
  // TODO: Implement reminders fetching and display
  // This is a basic placeholder implementation

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="flex-1 justify-center items-center py-16">
        <Ionicons name="alarm-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
          Reminders
        </Text>
        <Text className="text-base text-gray-500 text-center leading-6">
          Reminders for this lead will be displayed here.
        </Text>
        <Text className="text-sm text-gray-400 text-center mt-2">
          Feature coming soon
        </Text>
      </View>
    </ScrollView>
  );
};

export default RemindersTab;
