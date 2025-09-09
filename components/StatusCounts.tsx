import React, { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface StatusCountsProps {
  statusOptions: any[];
  statusCounts: { [key: string]: { count: number; filteredCount: number } };
  statusCountsLoading: boolean;
  statusCountsExpanded: boolean;
  onStatusCountsExpandedChange: (expanded: boolean) => void;
  onStatusFilter: (statusValue: string) => void;
}

const StatusCounts: React.FC<StatusCountsProps> = ({
  statusOptions,
  statusCounts,
  statusCountsLoading,
  statusCountsExpanded,
  onStatusCountsExpandedChange,
  onStatusFilter,
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<View>(null);

  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    // Check if content height exceeds the collapsed height (24px = max-h-6)
    const maxCollapsedHeight = 24;
    setIsOverflowing(height > maxCollapsedHeight);
  };

  const statusBadgeContent = (status: any) => {
    const statusData = statusCounts[status.value];
    const count = statusData?.count || 0;
    const filteredCount = statusData?.filteredCount || 0;

    if (count !== filteredCount) {
      return (
        <View className="flex-row items-baseline">
          <Text className="text-xs text-miles-800">{status.label}:</Text>
          <Text className="text-xs font-bold text-miles-800">
            {filteredCount}
          </Text>
          <Text className="text-gray-400 text-[10px]">/{count}</Text>
        </View>
      );
    }

    return (
      <View className="flex-row items-baseline">
        <Text className="text-xs text-miles-800">{status.label}:</Text>
        <Text className="text-xs font-bold text-miles-800">{count}</Text>
      </View>
    );
  };

  return (
    <View className="mx-4 my-4">
      <View
        className={`relative ${
          statusCountsExpanded ? "max-h-40" : "max-h-6 overflow-hidden"
        }`}
        style={{ paddingRight: 70 }}
      >
        {statusCountsLoading ? (
          <Text className="text-gray-500 text-sm">Loading...</Text>
        ) : (
          <View
            ref={contentRef}
            className="flex-row flex-wrap"
            style={{ gap: 8 }}
            onLayout={handleContentLayout}
          >
            {statusOptions.map((status) => {
              const statusData = statusCounts[status.value];
              if (
                !statusData ||
                (statusData.count === 0 && statusData.filteredCount === 0)
              )
                return null;

              return (
                <TouchableOpacity
                  key={status.value}
                  className="px-1.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: (status.color || "#3B82F6") + "16",
                    borderColor: (status.color || "#3B82F6") + "44",
                  }}
                  onPress={() => onStatusFilter(status.value)}
                >
                  {statusBadgeContent(status)}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fade effect when collapsed and overflowing */}
        {!statusCountsExpanded && isOverflowing && (
          <View
            className="absolute top-0 right-12 h-full bg-white"
            style={{
              width: 70,
              opacity: 0.8,
            }}
            pointerEvents="none"
          />
        )}

        {/* Expand/collapse button - only show when content overflows */}
        {isOverflowing && (
          <TouchableOpacity
            className="absolute right-0 top-0 px-1 py-0.5 rounded"
            onPress={() => onStatusCountsExpandedChange(!statusCountsExpanded)}
            style={{ zIndex: 10 }}
          >
            <Text className="text-xs text-miles-500">
              {statusCountsExpanded ? "Show less" : "Show more"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default StatusCounts;
