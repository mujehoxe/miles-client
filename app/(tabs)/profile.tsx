import LogoutButton from "../../components/LogoutButton";
import { UserContext } from "../_layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import Toast from "react-native-root-toast";

interface UserInfo {
  email?: string;
  name?: string;
  role?: string;
}

export default function ProfileScreen() {
  const user = useContext(UserContext);
  const [userInfo, setUserInfo] = useState<UserInfo>({});

  useEffect(() => {
    if (user) {
      // The user context should already have decoded JWT data
      setUserInfo(user);
    }
  }, [user]);

  const handleLogout = () => {
    // The LogoutButton component handles the actual logout process
    // The main _layout.tsx will automatically detect the token removal and show login screen
    Toast.show("Signing out...", {
      duration: Toast.durations.SHORT,
    });
  };

  const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
    icon,
    label,
    value,
  }) => (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon as any} size={20} color="#6B7280" />
        <Text className="text-gray-700 ml-3 font-medium">{label}</Text>
      </View>
      <Text className="text-gray-500 text-right flex-1 ml-4">{value}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white items-center py-8 px-5 border-b border-gray-200">
          <View className="mb-4">
            <Ionicons name="person-circle" size={80} color="#176298" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {userInfo.name || userInfo.email || "User"}
          </Text>
          {userInfo.role && (
            <Text className="text-gray-500 capitalize">{userInfo.role}</Text>
          )}
        </View>

        {/* Account Information */}
        <View className="px-5 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Account Information
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={userInfo.email || "Not available"}
            />
            {userInfo.role && (
              <InfoRow
                icon="shield-checkmark-outline"
                label="Role"
                value={userInfo.role}
              />
            )}
          </View>
        </View>

        {/* App Information */}
        <View className="px-5 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            App Information
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <InfoRow
              icon="phone-portrait-outline"
              label="Version"
              value="1.0.0"
            />
            <InfoRow
              icon="business-outline"
              label="App"
              value="Miles CRM"
            />
          </View>
        </View>

        {/* Actions */}
        <View className="px-5 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Actions
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="items-center py-2">
              <LogoutButton
                style="button"
                onLogout={handleLogout}
                color="#DC2626"
                size="medium"
                showText={true}
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-8 px-5">
          <Text className="text-gray-500 font-medium mb-1">
            Miles CRM Mobile App
          </Text>
          <Text className="text-gray-400">
            © 2024 Miles Homes Real Estate
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}