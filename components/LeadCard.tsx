import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import AuthenticatedImage from "./AuthenticatedImage";

const LeadCard = ({ lead, onDetailsPress, selected = false, onCardPress }) => {
  const [showContact, setShowContact] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handlePhoneCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber) => {
    Linking.openURL(
      `https://wa.me/${encodeURIComponent(
        phoneNumber
      )}?text=${encodeURIComponent("Your custom message here")}`
    );
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const StatusBadge = ({ status }) => (
    <View
      className="px-2 py-1 rounded self-start"
      style={{ backgroundColor: status?.color || "#E5E7EB" }}
    >
      <Text className="text-xs font-medium text-white">
        {status?.Status || "N/A"}
      </Text>
    </View>
  );

  const TagChip = ({ tag }) => (
    <View className="bg-miles-50 px-2 py-1 rounded-xl">
      <Text className="text-xs text-miles-800 font-medium">{tag.Tag}</Text>
    </View>
  );

  return (
    <TouchableOpacity
      className={`bg-white rounded-lg mb-3 shadow-sm border min-h-[300px] ${
        selected ? "border-miles-500 border-2" : "border-gray-200"
      }`}
      onPress={onCardPress}
    >
      {selected && (
        <View className="absolute -top-2 -left-2 z-10 bg-white rounded-xl">
          <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
        </View>
      )}

      {/* Header */}
      <View className="p-3 border-b border-gray-200">
        <Text
          className="text-base font-semibold text-gray-900 mb-2"
          numberOfLines={1}
        >
          {lead.Name}
        </Text>

        <View className="flex-row items-center justify-between">
          {lead?.Assigned ? (
            <>
              <Text className="text-sm text-gray-500 flex-1">
                Assigned to:{" "}
                <Text className="font-medium text-gray-900">
                  {lead.Assigned.username}
                </Text>
              </Text>
              {lead.Assigned?.Avatar && !avatarError ? (
                <AuthenticatedImage
                  source={{
                    uri: `${process.env.EXPO_PUBLIC_BASE_URL || ""}${encodeURI(
                      lead.Assigned.Avatar
                    )}`,
                  }}
                  className="w-6 h-6 rounded-full ml-2"
                  onError={(error) => {
                    console.log(
                      `Avatar loading error for ${lead.Assigned.username}:`,
                      {
                        originalPath: lead.Assigned.Avatar,
                        encodedPath: encodeURI(lead.Assigned.Avatar),
                        fullUri: `${
                          process.env.EXPO_PUBLIC_BASE_URL || ""
                        }${encodeURI(lead.Assigned.Avatar)}`,
                        error: error,
                      }
                    );
                    setAvatarError(true);
                  }}
                  onLoad={() => {
                    console.log(
                      `Avatar loaded successfully for ${lead.Assigned.username}: ${lead.Assigned.Avatar}`
                    );
                  }}
                />
              ) : (
                <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center ml-2">
                  <Ionicons name="person" size={16} color="#9CA3AF" />
                </View>
              )}
            </>
          ) : (
            <Text className="text-sm text-gray-500">
              Not assigned to any agent
            </Text>
          )}
        </View>
      </View>

      {/* Body */}
      <View className="p-3 flex-1">
        {/* Status and Source Row */}
        <View className="flex-row mb-3 gap-3">
          <View className="flex-1">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Status:
            </Text>
            <StatusBadge status={lead.LeadStatus} />
          </View>

          <View className="flex-1">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Source:
            </Text>
            <Text className="text-sm text-gray-900">
              {lead.Source?.Source || "N/A"}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Tags:
            </Text>
            <View className="flex-row flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag, index) => (
                <TagChip key={index} tag={tag} />
              ))}
              {lead.tags.length > 3 && (
                <Text className="text-xs text-gray-500 italic">
                  +{lead.tags.length - 3} more
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Description */}
        {lead.Description && (
          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Description:
            </Text>
            <Text className="text-sm text-gray-700 leading-5" numberOfLines={2}>
              {lead.Description}
            </Text>
          </View>
        )}

        {/* Last Comment */}
        {lead.lastComment && (
          <View className="mb-2">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Last Comment:
            </Text>
            <Text className="text-sm text-gray-900 leading-5" numberOfLines={2}>
              {lead.lastComment.Content}
            </Text>
            {lead.commentCount > 1 && (
              <TouchableOpacity onPress={onDetailsPress}>
                <Text className="text-xs text-miles-500 font-medium mt-1">
                  +{lead.commentCount - 1} more comments...
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Footer Actions */}
      <View className="flex-row border-t border-gray-200 mt-auto">
        <TouchableOpacity
          className="flex-1 flex-row justify-center items-center py-3"
          onPress={(e) => {
            e.stopPropagation();
            setShowContact(!showContact);
          }}
        >
          <Ionicons name="call" size={18} color="#6B7280" />
          <Text className="ml-1.5 text-gray-500 text-sm font-medium">
            Contact
          </Text>
        </TouchableOpacity>

        <View className="w-px bg-gray-200" />

        <TouchableOpacity
          className="flex-1 flex-row justify-center items-center py-3"
          onPress={(e) => {
            e.stopPropagation();
            onDetailsPress();
          }}
        >
          <Ionicons name="information-circle" size={18} color="#6B7280" />
          <Text className="ml-1.5 text-gray-500 text-sm font-medium">
            Details
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contact Section */}
      {showContact && (
        <View className="p-3 bg-gray-50 rounded-b-lg gap-2">
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 flex-row items-center px-2 py-1.5 bg-miles-50 rounded-2xl border border-miles-500"
              onPress={() => handlePhoneCall(lead.Phone)}
            >
              <Ionicons name="call" size={16} color="#3B82F6" />
              <Text className="ml-1.5 text-miles-800 text-xs font-medium">
                {lead.Phone}
              </Text>
            </TouchableOpacity>

            {lead.AltPhone && (
              <TouchableOpacity
                className="flex-1 flex-row items-center px-2 py-1.5 bg-miles-50 rounded-2xl border border-miles-500"
                onPress={() => handlePhoneCall(lead.AltPhone)}
              >
                <Ionicons name="call" size={16} color="#DC2626" />
                <Text className="ml-1.5 text-red-600 text-xs font-medium">
                  {lead.AltPhone}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 flex-row items-center px-2 py-1.5 bg-green-50 rounded-2xl border border-emerald-500"
              onPress={() => handleWhatsApp(lead.Phone)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
              <Text className="ml-1.5 text-emerald-600 text-xs font-medium">
                WhatsApp
              </Text>
            </TouchableOpacity>

            {lead.AltPhone && (
              <TouchableOpacity
                className="flex-1 flex-row items-center px-2 py-1.5 bg-green-50 rounded-2xl border border-emerald-500"
                onPress={() => handleWhatsApp(lead.AltPhone)}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
                <Text className="ml-1.5 text-emerald-600 text-xs font-medium">
                  Alt WhatsApp
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {lead.lastCalled && (
            <View className="items-center mt-1">
              <Text className="text-xs text-gray-500 bg-indigo-50 px-2 py-1 rounded-xl font-medium">
                Last called {formatTimeAgo(lead.lastCalled)}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default LeadCard;
