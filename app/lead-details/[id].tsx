import { getUserPermissions } from "@/utils/userPermissions";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CommentsTab from "../../components/leadDetails/CommentsTab";
import MeetingsTab from "../../components/leadDetails/MeetingsTab";
import ProfileTab from "../../components/leadDetails/ProfileTab";
import RemindersTab from "../../components/leadDetails/RemindersTab";
import { fetchLeadById } from "../../services/api";

interface Lead {
  _id: string;
  Name: string;
  Phone?: string;
  AltPhone?: string;
  Description?: string;
  Email?: string;
  Address?: string;
  Type?: string;
  Project?: string;
  Budget?: string;
  LeadStatus?: {
    _id: string;
    Status: string;
    color: string;
  };
  Source?: {
    _id: string;
    Source: string;
  };
  Assigned?: {
    _id: string;
    username: string;
    Avatar?: string;
  };
  tags?: Array<{
    Tag: string;
  }>;
  timestamp?: string;
  LeadAssignedDate?: string;
  dynamicFields?: Record<string, any>;
}

type TabType = "Profile" | "Comments" | "Reminders" | "Meetings";

export default function LeadDetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("Profile");
  const [error, setError] = useState<string | null>(null);

  const permissions = getUserPermissions();

  useEffect(() => {
    if (!id) return;

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);
        const leadData = await fetchLeadById(id);
        setLead(leadData);
      } catch (err) {
        console.error("Error fetching lead:", err);
        setError("Failed to load lead details");
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLead(updatedLead);
  };

  const renderTabButton = (tab: TabType, label: string) => (
    <TouchableOpacity
      key={tab}
      className={`px-4 py-2 rounded-lg ${
        activeTab === tab ? "bg-miles-100" : "bg-transparent"
      }`}
      onPress={() => setActiveTab(tab)}
    >
      <Text
        className={`text-sm font-medium ${
          activeTab === tab ? "text-miles-800" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (!lead) return null;

    switch (activeTab) {
      case "Profile":
        return (
          <ProfileTab
            lead={lead}
            onLeadUpdate={handleLeadUpdate}
            userPermissions={permissions}
          />
        );
      case "Comments":
        return <CommentsTab lead={lead} />;
      case "Reminders":
        return <RemindersTab lead={lead} />;
      case "Meetings":
        return <MeetingsTab lead={lead} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-2">Loading lead details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lead) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-800 mt-4 text-center">
            {error || "Lead not found"}
          </Text>
          <TouchableOpacity
            className="bg-miles-500 px-6 py-3 rounded-lg mt-4"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View className="flex-1 mx-4">
          <Text
            className="text-lg font-semibold text-gray-900 text-center"
            numberOfLines={1}
          >
            {lead.Name}
          </Text>
        </View>

        <View className="w-10" />
      </View>

      {/* Tab Navigation */}
      <View className="px-4 py-3 border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          <View className="flex-row gap-2">
            {renderTabButton("Profile", "Profile")}
            {renderTabButton("Comments", "Comments")}
            {renderTabButton("Reminders", "Reminders")}
            {renderTabButton("Meetings", "Meetings")}
          </View>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View className="flex-1">{renderTabContent()}</View>
    </SafeAreaView>
  );
}
