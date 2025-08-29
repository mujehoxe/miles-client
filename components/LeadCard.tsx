import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import Animated, { SlideInDown, SlideOutUp } from "react-native-reanimated";
import { formatPhoneNumber, formatTimestamp } from "../utils/dateFormatter";
import AuthenticatedImage from "./AuthenticatedImage";
import SourcePicker from "./SourcePicker";
import StatusPicker from "./StatusPicker";
import UpdateDescriptionInput from "./UpdateDescriptionInput";

interface Lead {
  _id: string;
  Name: string;
  Phone?: string;
  AltPhone?: string;
  Description?: string;
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
    username: string;
    Avatar?: string;
  };
  tags?: Array<{
    Tag: string;
  }>;
  lastComment?: {
    Content: string;
  };
  commentCount?: number;
  visibleCommentCount?: number;
  timestamp?: string;
  LeadAssignedDate?: string;
  lastCalled?: string;
}

interface LeadCardProps {
  lead: Lead;
  onDetailsPress: () => void;
  selected?: boolean;
  onCardPress: () => void;
  statusOptions?: Array<{
    value: string;
    label: string;
    color: string;
    requiresReminder?: "yes" | "no" | "optional";
  }>;
  sourceOptions?: Array<{
    value: string;
    label: string;
  }>;
  onLeadUpdate?: (leadId: string, updates: any) => Promise<void>;
  userPermissions?: {
    lead?: string[];
  };
  onOpenModal?: (type: string, callback?: () => void) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onDetailsPress,
  selected = false,
  onCardPress,
  statusOptions = [],
  sourceOptions = [],
  onLeadUpdate,
  userPermissions,
  onOpenModal,
}) => {
  const [showContact, setShowContact] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateBody, setUpdateBody] = useState<any>({});
  const [isUpdateDescriptionInput, setIsUpdateDescriptionInput] =
    useState(false);

  useEffect(() => {
    setUpdateBody({
      updateDescription: "",
      originalLeadStatus: lead.LeadStatus,
    });
    setShowCommentInput(false);
    setIsUpdateDescriptionInput(false);
  }, [lead]);

  const handlePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.startsWith("***")) {
      Alert.alert(
        "Contact Unavailable",
        !phoneNumber
          ? "Contact information not available"
          : "Contact information is masked"
      );
      return;
    }
    Linking.openURL(`tel:${formatPhoneNumber(phoneNumber)}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.startsWith("***")) {
      Alert.alert(
        "Contact Unavailable",
        !phoneNumber
          ? "Contact information not available"
          : "Contact information is masked"
      );
      return;
    }
    Linking.openURL(
      `https://wa.me/${encodeURIComponent(
        formatPhoneNumber(phoneNumber)
      )}?text=${encodeURIComponent(
        "Hello! I'm reaching out regarding your inquiry."
      )}`
    );
  };

  const canUpdateStatus =
    userPermissions?.lead?.includes("update_status") ?? true;
  const canUpdateSource =
    userPermissions?.lead?.includes("update_source") ?? true;
  const canUpdateInfo = userPermissions?.lead?.includes("update_info") ?? true;
  const canViewSensitiveDetails =
    userPermissions?.lead?.includes("view_sensetive_details") ?? true;

  // Debug logging (limited to reduce spam)
  if (statusOptions.length > 0 && lead.Name && lead._id) {
    console.log("LeadCard Debug:", {
      leadName: lead.Name,
      statusOptionsCount: statusOptions.length,
      sourceOptionsCount: sourceOptions.length,
      hasStatusId: !!lead.LeadStatus?._id,
      hasSourceId: !!lead.Source?._id,
    });
  }

  const handleStatusChange = (value: string, option: any) => {
    setUpdateBody({
      ...updateBody,
      LeadStatus: {
        ...lead.LeadStatus,
        _id: option.value,
        Status: option.label,
        color: option.color,
      },
      originalLeadStatus: lead.LeadStatus,
    });

    setIsUpdateDescriptionInput(true);

    // Automatically open comment input when status changes
    if (option.value !== lead.LeadStatus?._id) {
      setShowCommentInput(true);
      setShowContact(false);
    }
  };

  const handleSourceChange = (value: string, option: any) => {
    setUpdateBody({
      ...updateBody,
      Source: {
        ...lead.Source,
        _id: option.value,
        Source: option.label,
      },
    });

    // Show comment input when source changes
    if (option.value !== lead.Source?._id) {
      setShowCommentInput(true);
      setShowContact(false);
    }
  };

  const handleTagsChanged = (newTags: any[]) => {
    setUpdateBody({
      ...updateBody,
      tags: newTags,
    });

    // Show comment input when tags change
    if (JSON.stringify(newTags) !== JSON.stringify(lead.tags)) {
      setShowCommentInput(true);
      setShowContact(false);
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      setLoading(true);
      const statusChanged =
        updateBody?.LeadStatus &&
        updateBody?.LeadStatus?._id !== lead.LeadStatus?._id;
      const description = updateBody?.updateDescription || "";
      const wordCount = description.trim().split(/\s+/).length;

      // Get the status label for the new status
      const newStatusLabel = statusOptions.find(
        (o) => o.value === updateBody.LeadStatus?._id
      )?.label;

      // List of statuses that don't require description
      const noDescriptionStatuses = ["RNR"];

      if (
        statusChanged &&
        wordCount < 3 &&
        !noDescriptionStatuses.includes(newStatusLabel || "")
      ) {
        Alert.alert(
          "Error",
          "Description must exceed 2 words on status change."
        );
        return;
      }

      // Check if status is being changed to "Meeting"
      if (
        statusChanged &&
        updateBody.LeadStatus?._id ===
          statusOptions.find((o) => o.label === "Meeting")?.value
      ) {
        // Open meeting modal
        onOpenModal?.("Add Meeting", () => updateLead());
        return;
      }

      // Handle requiresReminder logic based on the new status
      const newStatus = statusOptions.find(
        (o) => o.value === updateBody.LeadStatus?._id
      );
      if (statusChanged && newStatus?.requiresReminder) {
        if (newStatus.requiresReminder === "yes") {
          // Force reminder modal before update
          onOpenModal?.("Add Reminder", () => updateLead());
          return;
        } else if (
          newStatus.requiresReminder === "optional" &&
          !showCommentInput
        ) {
          // Show comment input with optional reminder button only if not already shown
          setIsUpdateDescriptionInput(true);
          setShowCommentInput(true);
          setLoading(false);
          return;
        }
      }

      // Check if status is being changed to "Closure"
      const isChangingToClosure =
        statusChanged &&
        statusOptions.find((o) => o.value === updateBody.LeadStatus?._id)
          ?.label === "Closure";

      await updateLead();

      // If status was changed to Closure, show success message
      if (isChangingToClosure) {
        Alert.alert(
          "Success",
          "Lead status changed to Closure. You can now create a deal from this lead."
        );
      }
    } catch (e: any) {
      console.error("Error updating lead:", e);
      Alert.alert(
        "Error",
        `An error occurred while updating the lead: ${e.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async () => {
    if (!onLeadUpdate) return;

    const payload = {
      ...updateBody,
    };

    await onLeadUpdate(lead._id, payload);

    // Reset UI state after successful update
    setIsUpdateDescriptionInput(false);
    setShowCommentInput(false);
    setUpdateBody({
      updateDescription: "",
      originalLeadStatus: lead.LeadStatus,
    });
  };

  const handleDescriptionChange = (description: string) => {
    setUpdateBody((prevBody: any) => ({
      ...prevBody,
      updateDescription: description,
    }));
  };

  const toggleContactInfo = () => {
    setShowContact(!showContact);
    if (!showContact) {
      setShowCommentInput(false);
    }
  };

  const toggleCommentInput = () => {
    setShowCommentInput(!showCommentInput);
    if (!showCommentInput) {
      setShowContact(false);
    }
  };

  const handleReminderPress = () => {
    const isStatusChange =
      updateBody?.LeadStatus &&
      updateBody.originalLeadStatus &&
      updateBody.LeadStatus._id !== updateBody.originalLeadStatus._id;

    const newStatus = statusOptions.find(
      (s) => s.value === updateBody?.LeadStatus?._id
    );
    const isRequiredReminder =
      isStatusChange && newStatus?.requiresReminder === "yes";

    if (isRequiredReminder) {
      // For required reminders, auto-update lead after reminder is saved
      onOpenModal?.("Add Reminder", () => updateLead());
    } else {
      // For optional reminders, just open modal without auto-updating lead
      onOpenModal?.("Add Reminder", () => {
        Alert.alert("Success", "Reminder added successfully");
      });
    }
  };

  return (
    <TouchableOpacity
      className={`bg-white rounded-lg mb-3 shadow-sm border min-h-[340px] ${
        selected ? "border-miles-500 border-2" : "border-gray-200"
      }`}
      onPress={onCardPress}
    >
      {/* Header */}
      <View className="w-full p-3 border-b border-gray-200">
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text
              className={`text-base font-semibold text-gray-900`}
              numberOfLines={1}
            >
              {lead.Name}
            </Text>

            <View className="flex-row items-center">
              {lead?.Assigned ? (
                <>
                  <Text className="text-sm text-nowrap text-gray-500">
                    Assigned to:{" "}
                    <Text className="font-medium text-gray-900">
                      {lead.Assigned.username.replaceAll("  ", " ")}
                    </Text>
                  </Text>
                </>
              ) : (
                <Text className="text-sm text-gray-500">
                  Not assigned to any agent
                </Text>
              )}
            </View>
          </View>

          {lead.Assigned?.Avatar && !avatarError ? (
            <AuthenticatedImage
              source={{
                uri: `${process.env.EXPO_PUBLIC_BASE_URL || ""}${encodeURI(
                  lead.Assigned.Avatar
                )}`,
              }}
              className="size-10 rounded-full ml-2"
              onError={(error) => {
                console.log(
                  `Avatar loading error for ${lead.Assigned?.username}:`,
                  {
                    originalPath: lead.Assigned?.Avatar,
                    encodedPath: encodeURI(lead.Assigned?.Avatar || ""),
                    fullUri: `${
                      process.env.EXPO_PUBLIC_BASE_URL || ""
                    }${encodeURI(lead.Assigned?.Avatar || "")}`,
                    error: error,
                  }
                );
                setAvatarError(true);
              }}
              onLoad={() => {
                console.log(
                  `Avatar loaded successfully for ${lead.Assigned?.username}: ${lead.Assigned?.Avatar}`
                );
              }}
              fallbackComponent={
                <View className="size-10 rounded-full bg-gray-100 items-center justify-center ml-2">
                  <Ionicons name="person" size={16} color="#9CA3AF" />
                </View>
              }
            />
          ) : (
            <View className="size-10 rounded-full bg-gray-100 items-center justify-center ml-2">
              <Ionicons name="person" size={16} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Show creation and assignment dates if available */}
        {(lead.timestamp || lead.LeadAssignedDate) && (
          <View className="flex flex-col items-start flex-wrap gap-1 mt-2">
            {lead.lastCalled && lead.LeadStatus?.Status !== "New" && (
              <View className="flex-shrink-0">
                <Text className="text-xs px-2 py-1 bg-miles-100 text-miles-800 rounded-full font-medium">
                  {formatTimestamp(lead.lastCalled)}
                </Text>
              </View>
            )}
            {lead.timestamp && (
              <Text className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                Created: {formatTimestamp(lead.timestamp)}
              </Text>
            )}
            {lead.LeadAssignedDate && (
              <Text className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                Assigned: {formatTimestamp(lead.LeadAssignedDate)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Body */}
      <View className="p-3 flex-1">
        {/* Status and Source Row */}
        <View className="flex-row mb-3 gap-3">
          <View className="flex-1">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Status:
            </Text>
            <View onStartShouldSetResponder={() => true}>
              <StatusPicker
                value={
                  updateBody?.LeadStatus?._id || lead.LeadStatus?._id || ""
                }
                options={statusOptions}
                onValueChange={handleStatusChange}
                disabled={!canUpdateStatus}
              />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Source:
            </Text>
            <View onStartShouldSetResponder={() => true}>
              <SourcePicker
                value={updateBody?.Source?._id || lead.Source?._id || ""}
                options={sourceOptions}
                onValueChange={handleSourceChange}
                disabled={!canUpdateSource}
              />
            </View>
          </View>
        </View>

        {/* Tags - Read Only Display */}
        {lead.tags && lead.tags.length > 0 && (
          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Tags:
            </Text>
            <View className="flex-row flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag, index) => (
                <View
                  key={index}
                  className="bg-miles-50 px-2 py-1 rounded-xl border border-miles-200"
                >
                  <Text className="text-xs text-miles-700 font-medium">
                    {tag.Tag}
                  </Text>
                </View>
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
        {lead.lastComment?.Content && lead.LeadStatus?.Status !== "New" && (
          <View className="mb-2">
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Last Comment:
            </Text>
            <Text className="text-sm text-gray-900 leading-5" numberOfLines={2}>
              {lead.lastComment.Content}
            </Text>
            {lead.visibleCommentCount && lead.visibleCommentCount - 1 > 0 && (
              <TouchableOpacity onPress={onDetailsPress}>
                <Text className="text-xs text-miles-500 font-medium mt-1">
                  +{lead.visibleCommentCount - 1} more...
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Footer Actions */}
      <View className="flex-row border-t border-gray-200 mt-auto">
        <TouchableOpacity
          className="flex-1 flex-row justify-center items-center py-2.5"
          onPress={(e) => {
            e.stopPropagation();
            toggleContactInfo();
          }}
        >
          <Ionicons name="call" size={18} color="#6B7280" />
          <Text className="ml-1.5 text-gray-500 text-sm font-medium">
            Contact
          </Text>
        </TouchableOpacity>

        <View className="w-px bg-gray-200" />

        <TouchableOpacity
          className="flex-1 flex-row justify-center items-center py-2.5"
          onPress={(e) => {
            e.stopPropagation();
            toggleCommentInput();
          }}
        >
          <Ionicons name="chatbubble" size={18} color="#6B7280" />
          <Text className="ml-1.5 text-gray-500 text-sm font-medium">
            Comment
          </Text>
        </TouchableOpacity>

        <View className="w-px bg-gray-200" />

        <TouchableOpacity
          className="flex-1 flex-row justify-center items-center py-2.5"
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/lead-details/${lead._id}`);
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
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutUp.duration(300)}
          className="p-3 bg-gray-50 gap-2"
        >
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 flex-row items-center px-2 py-1.5 rounded-2xl border ${
                !lead.Phone || lead.Phone.startsWith("***")
                  ? "bg-gray-100 border-gray-300"
                  : "bg-miles-50 border-miles-500"
              }`}
              onPress={() => handlePhoneCall(lead.Phone || "")}
            >
              <Ionicons
                name="call"
                size={16}
                color={
                  !lead.Phone || lead.Phone.startsWith("***")
                    ? "#9CA3AF"
                    : "#3B82F6"
                }
              />
              <Text
                className={`ml-1.5 text-xs font-medium ${
                  !lead.Phone || lead.Phone.startsWith("***")
                    ? "text-gray-500"
                    : "text-miles-800"
                }`}
              >
                {lead.Phone ? formatPhoneNumber(lead.Phone) : "N/A"}
              </Text>
            </TouchableOpacity>

            {lead.AltPhone && (
              <TouchableOpacity
                className={`flex-1 flex-row items-center px-2 py-1.5 rounded-2xl border ${
                  !lead.AltPhone || lead.AltPhone.startsWith("***")
                    ? "bg-gray-100 border-gray-300"
                    : "bg-red-50 border-red-500"
                }`}
                onPress={() => handlePhoneCall(lead.AltPhone)}
              >
                <Ionicons
                  name="call"
                  size={16}
                  color={
                    !lead.AltPhone || lead.AltPhone.startsWith("***")
                      ? "#9CA3AF"
                      : "#DC2626"
                  }
                />
                <Text
                  className={`ml-1.5 text-xs font-medium ${
                    !lead.AltPhone || lead.AltPhone.startsWith("***")
                      ? "text-gray-500"
                      : "text-red-600"
                  }`}
                >
                  {formatPhoneNumber(lead.AltPhone)}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 flex-row items-center px-2 py-1.5 rounded-2xl border ${
                !lead.Phone || lead.Phone.startsWith("***")
                  ? "bg-gray-100 border-gray-300"
                  : "bg-green-50 border-emerald-500"
              }`}
              onPress={() => handleWhatsApp(lead.Phone || "")}
            >
              <Ionicons
                name="logo-whatsapp"
                size={16}
                color={
                  !lead.Phone || lead.Phone.startsWith("***")
                    ? "#9CA3AF"
                    : "#10B981"
                }
              />
              <Text
                className={`ml-1.5 text-xs font-medium ${
                  !lead.Phone || lead.Phone.startsWith("***")
                    ? "text-gray-500"
                    : "text-emerald-600"
                }`}
              >
                Primary
              </Text>
            </TouchableOpacity>

            {lead.AltPhone && (
              <TouchableOpacity
                className={`flex-1 flex-row items-center px-2 py-1.5 rounded-2xl border ${
                  !lead.AltPhone || lead.AltPhone.startsWith("***")
                    ? "bg-gray-100 border-gray-300"
                    : "bg-green-50 border-emerald-500"
                }`}
                onPress={() => handleWhatsApp(lead.AltPhone)}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={16}
                  color={
                    !lead.AltPhone || lead.AltPhone.startsWith("***")
                      ? "#9CA3AF"
                      : "#10B981"
                  }
                />
                <Text
                  className={`ml-1.5 text-xs font-medium ${
                    !lead.AltPhone || lead.AltPhone.startsWith("***")
                      ? "text-gray-500"
                      : "text-emerald-600"
                  }`}
                >
                  Alternative
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Update Description Input */}
      <UpdateDescriptionInput
        isUpdateDescriptionInput={showCommentInput}
        loading={loading}
        onDescriptionChange={handleDescriptionChange}
        onSubmit={handleUpdateSubmit}
        onReminderPress={handleReminderPress}
        showReminderButton={
          // Show for non-status changes (regular comments)
          !updateBody?.LeadStatus ||
          (updateBody.LeadStatus && !updateBody.originalLeadStatus) ||
          (updateBody.LeadStatus &&
            updateBody.originalLeadStatus &&
            updateBody.LeadStatus._id === updateBody.originalLeadStatus._id) ||
          // Show for status changes with requiresReminder: 'optional'
          (updateBody?.LeadStatus &&
            updateBody.originalLeadStatus &&
            updateBody.LeadStatus._id !== updateBody.originalLeadStatus._id &&
            statusOptions &&
            statusOptions.find((s) => s.value === updateBody.LeadStatus._id)
              ?.requiresReminder === "optional")
        }
      />
    </TouchableOpacity>
  );
};

export default LeadCard;
