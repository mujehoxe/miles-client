import { clearAuthData, fetchCampaignsWithCounts } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";
import { UserContext } from "../_layout";

interface Campaign {
  _id: string;
  Tag: string;
  leadCount: number;
  pendingLeadsCount?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CampaignsTab() {
  const user = useContext(UserContext);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingTriggered, setIsLoadingTriggered] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadCampaigns = useCallback(
    async (page = 1, append = false) => {
      if (!user) {
        setError("Please log in to view campaigns");
        setLoading(false);
        return;
      }

      try {
        setError(null);
        if (append) {
          setLoadingMore(true);
        }

        const response = await fetchCampaignsWithCounts(page, 20); // Load 20 items per page
        const { data: campaignsData, pagination: paginationData } = response;

        if (append) {
          // Append new campaigns to existing list
          setCampaigns((prev) => [...prev, ...campaignsData]);
        } else {
          // Replace campaigns (for refresh or initial load)
          setCampaigns(campaignsData);
        }

        setPagination(paginationData || null);
        setCurrentPage(page);
      } catch (error: any) {
        console.error("=== CAMPAIGNS ERROR DEBUG ===");
        console.error("Full error object:", error);
        console.error("Error message:", error?.message);
        console.error("Error name:", error?.name);
        console.error("Error stack:", error?.stack);
        console.error("Error cause:", error?.cause);
        console.error("User context:", {
          userId: user?.id,
          username: user?.username,
        });
        console.error("==============================");

        const errorMessage = error?.message || "Failed to load campaigns";
        setError(errorMessage);

        if (errorMessage.includes("Authentication failed")) {
          Toast.show("Session expired. Please login again.", {
            duration: Toast.durations.LONG,
          });
          // Clear auth data - this will trigger the root layout to show login
          setTimeout(async () => {
            await clearAuthData();
          }, 1500);
        } else if (errorMessage.includes("Network request failed")) {
          Toast.show(
            "Cannot connect to server. Please check your connection.",
            {
              duration: Toast.durations.LONG,
            }
          );
          // For network failures, also clear auth to force re-authentication
          setTimeout(async () => {
            await clearAuthData();
          }, 2000);
        } else {
          Toast.show("Failed to load campaigns", {
            duration: Toast.durations.SHORT,
          });
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCampaigns(1, false); // Reset to page 1
    } finally {
      setRefreshing(false);
    }
  }, [loadCampaigns]);

  const loadMoreCampaigns = useCallback(async () => {
    if (loadingMore || !pagination?.hasNextPage || isLoadingTriggered) {
      return;
    }

    setIsLoadingTriggered(true);
    const nextPage = currentPage + 1;
    await loadCampaigns(nextPage, true); // Append to existing data
    setIsLoadingTriggered(false);
  }, [loadCampaigns, loadingMore, pagination, currentPage, isLoadingTriggered]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;

      // Calculate how much of the content has been scrolled
      const paddingToBottom = 500; // Start loading when 300px from bottom
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;

      const distanceFromBottom =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);

      // Debug logging (can be removed later)
      if (distanceFromBottom < 400) {
        console.log(
          `📊 Distance from bottom: ${Math.round(distanceFromBottom)}px`
        );
        console.log(`🔄 Loading states:`, {
          loadingMore,
          isLoadingTriggered,
          hasNextPage: pagination?.hasNextPage,
          currentPage,
          totalPages: pagination?.totalPages,
        });
      }

      // Trigger loading when close to bottom and not already loading
      if (
        isCloseToBottom &&
        !loadingMore &&
        !isLoadingTriggered &&
        pagination?.hasNextPage
      ) {
        console.log("🚀 Triggering load more - user is near bottom");
        console.log(
          `📄 Loading page ${currentPage + 1} of ${pagination.totalPages}`
        );
        loadMoreCampaigns();
      }
    },
    [
      loadingMore,
      isLoadingTriggered,
      pagination,
      loadMoreCampaigns,
      currentPage,
    ]
  );

  const handleCampaignPress = useCallback((campaign: Campaign) => {
    // Navigate to leads list with this campaign/tag filter
    const tagFilter = `${campaign.Tag}::${campaign._id}`;
    router.push({
      pathname: "/(tabs)/leads",
      params: {
        selectedTags: JSON.stringify([tagFilter]),
        campaignName: campaign.Tag,
      },
    });
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const renderCampaignCard = ({ item }: { item: Campaign }) => (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-lg shadow-sm border border-gray-100"
      onPress={() => handleCampaignPress(item)}
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {item.Tag}
            </Text>
            <View className="flex-col space-y-1">
              <View className="flex-row items-center">
                <Ionicons name="people" size={16} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  {item.leadCount} lead{item.leadCount !== 1 ? "s" : ""}
                </Text>
              </View>
              {item.pendingLeadsCount !== undefined && (
                <View className="flex-row items-center">
                  <Ionicons 
                    name={item.pendingLeadsCount > 0 ? "time-outline" : "checkmark-circle-outline"} 
                    size={16} 
                    color={item.pendingLeadsCount > 0 ? "#F59E0B" : "#10B981"} 
                  />
                  <Text className={`text-sm ml-2 ${
                    item.pendingLeadsCount > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {item.pendingLeadsCount}/{item.leadCount} pending
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View className="flex-row items-center">
            <View
              className={`px-3 py-1 rounded-full ${
                item.leadCount > 100
                  ? "bg-green-100"
                  : item.leadCount > 50
                  ? "bg-yellow-100"
                  : item.leadCount > 0
                  ? "bg-blue-100"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  item.leadCount > 100
                    ? "text-green-700"
                    : item.leadCount > 50
                    ? "text-yellow-700"
                    : item.leadCount > 0
                    ? "text-blue-700"
                    : "text-gray-600"
                }`}
              >
                {item.leadCount}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              className="ml-2"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (error) {
      const isNetworkOrAuthError =
        error.includes("Network request failed") ||
        error.includes("Authentication failed");

      return (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="warning-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
            {isNetworkOrAuthError
              ? "Connection Issue"
              : "Unable to load campaigns"}
          </Text>
          <Text className="text-gray-600 text-center mb-4">
            {isNetworkOrAuthError
              ? "Cannot connect to server. Authentication will be cleared to resolve this issue."
              : error}
          </Text>
          {!isNetworkOrAuthError && (
            <TouchableOpacity
              className="bg-miles-600 px-4 py-2 rounded-lg"
              onPress={() => {
                setError(null);
                loadCampaigns();
              }}
            >
              <Text className="text-white font-medium">Try Again</Text>
            </TouchableOpacity>
          )}
          {isNetworkOrAuthError && (
            <View className="flex-row items-center mt-2">
              <ActivityIndicator size="small" color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2">
                Clearing auth...
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View className="flex-1 justify-center items-center px-6">
        <Ionicons name="pricetags-outline" size={64} color="#9CA3AF" />
        <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
          No campaigns found
        </Text>
        <Text className="text-gray-600 text-center">
          Campaigns will appear here once tags are added to leads
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View className="bg-white px-4 pt-4 pb-2 border-b border-gray-200">
      <Text className="text-2xl font-bold text-gray-900 mb-1">Campaigns</Text>
      <Text className="text-gray-600">
        {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
        {pagination && ` of ${pagination.totalCount}`} •{" "}
        {campaigns.reduce((total, campaign) => total + campaign.leadCount, 0)}{" "}
        total leads
      </Text>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!loadingMore) return null;

    return (
      <View className="py-4 flex-row justify-center items-center">
        <ActivityIndicator size="small" color="#059669" />
        <Text className="text-gray-600 ml-2">Loading more campaigns...</Text>
      </View>
    );
  };

  // Show loading state only when not authenticated
  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-4">Checking authentication...</Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-4">Loading campaigns...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        ref={flatListRef}
        data={campaigns}
        renderItem={renderCampaignCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16} // Fire scroll events every 16ms for smooth detection
        contentContainerStyle={
          campaigns.length === 0
            ? { flex: 1 }
            : { paddingBottom: 20, paddingTop: 16 }
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Optimize performance for long lists
        maxToRenderPerBatch={10} // Render 10 items per batch for better performance
        updateCellsBatchingPeriod={50} // Update batches every 50ms
        initialNumToRender={20} // Render first 20 items immediately
      />
    </View>
  );
}
