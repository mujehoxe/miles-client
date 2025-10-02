import LoadingView from "@/components/LoadingView";
import { fetchCampaignLeads } from "@/services/campaignApi";
import { getUserPermissions } from "@/utils/userPermissions";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
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
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const id = params.id as string;
  
  // Check if we're in calling mode
  const fromCalling = params.fromCalling === 'true';
  const campaignId = params.campaignId as string;
  const campaignName = params.campaignName as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("Profile");
  const [error, setError] = useState<string | null>(null);
  
  // Calling-related state
  const [campaignLeads, setCampaignLeads] = useState<string[]>([]);
  const [currentLeadIndex, setCurrentLeadIndex] = useState(-1);
  const [loadingNavigation, setLoadingNavigation] = useState(false);

  const permissions = getUserPermissions();

  // Load campaign leads if in calling mode
  const loadCampaignLeads = useCallback(async () => {
    if (!fromCalling || !campaignName) return;

    try {
      const response = await fetchCampaignLeads({
        campaignName,
        page: 1,
        limit: 1000, // Load all leads for navigation
      });
      
      const leadIds = response.data.map((lead: any) => lead._id);
      setCampaignLeads(leadIds);
      
      // Find current lead index
      const index = leadIds.indexOf(id);
      setCurrentLeadIndex(index);
    } catch (error) {
      console.error('Failed to load campaign leads:', error);
    }
  }, [fromCalling, campaignName, id]);

  // Navigate to next lead
  const navigateToNextLead = useCallback(async () => {
    if (currentLeadIndex === -1 || currentLeadIndex >= campaignLeads.length - 1) return;
    
    setLoadingNavigation(true);
    const nextLeadId = campaignLeads[currentLeadIndex + 1];
    
    router.replace({
      pathname: `/lead-details/${nextLeadId}`,
      params: {
        fromCalling: 'true',
        campaignId,
        campaignName,
      },
    });
  }, [currentLeadIndex, campaignLeads, router, campaignId, campaignName]);

  // Navigate to previous lead
  const navigateToPreviousLead = useCallback(async () => {
    if (currentLeadIndex <= 0) return;
    
    setLoadingNavigation(true);
    const previousLeadId = campaignLeads[currentLeadIndex - 1];
    
    router.replace({
      pathname: `/lead-details/${previousLeadId}`,
      params: {
        fromCalling: 'true',
        campaignId,
        campaignName,
      },
    });
  }, [currentLeadIndex, campaignLeads, router, campaignId, campaignName]);

  // Set the header title when lead data is loaded
  useEffect(() => {
    if (lead && navigation) {
      navigation.setOptions({
        headerTitle: lead.Name,
      });
    }
  }, [lead, navigation]);

  useEffect(() => {
    if (!id) return;

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);
        const leadData = await fetchLeadById(id);
        setLead(leadData);
        
        // Load campaign leads if in calling mode
        if (fromCalling) {
          await loadCampaignLeads();
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load lead details");
      } finally {
        setLoading(false);
        setLoadingNavigation(false);
      }
    };

    fetchLead();
  }, [id, fromCalling, loadCampaignLeads]);

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
          <LoadingView />
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
      {/* Calling Navigation - Show only if in calling mode */}
      {fromCalling && (
        <View className="px-4 py-3 bg-miles-50 border-b border-miles-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="call" size={18} color="#059669" />
              <Text className="text-sm font-medium text-miles-700 ml-2">
                Campaign: {campaignName}
              </Text>
              {currentLeadIndex >= 0 && campaignLeads.length > 0 && (
                <Text className="text-sm text-miles-600 ml-2">
                  ({currentLeadIndex + 1} of {campaignLeads.length})
                </Text>
              )}
            </View>
            
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className={`p-2 rounded-full ${
                  currentLeadIndex <= 0 || loadingNavigation
                    ? "bg-gray-100"
                    : "bg-miles-100"
                }`}
                onPress={navigateToPreviousLead}
                disabled={currentLeadIndex <= 0 || loadingNavigation}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={currentLeadIndex <= 0 || loadingNavigation ? "#9CA3AF" : "#059669"}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`p-2 rounded-full ${
                  currentLeadIndex >= campaignLeads.length - 1 || loadingNavigation
                    ? "bg-gray-100"
                    : "bg-miles-100"
                }`}
                onPress={navigateToNextLead}
                disabled={currentLeadIndex >= campaignLeads.length - 1 || loadingNavigation}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={
                    currentLeadIndex >= campaignLeads.length - 1 || loadingNavigation
                      ? "#9CA3AF"
                      : "#059669"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
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
