import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
    if (!dateString) return '';
    
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
    <View style={[
      styles.statusBadge, 
      { backgroundColor: status?.color || '#E5E7EB' }
    ]}>
      <Text style={styles.statusText}>
        {status?.Status || 'N/A'}
      </Text>
    </View>
  );

  const TagChip = ({ tag }) => (
    <View style={styles.tagChip}>
      <Text style={styles.tagChipText}>{tag.Tag}</Text>
    </View>
  );

  return (
    <TouchableOpacity 
      style={[styles.card, selected && styles.selectedCard]} 
      onPress={onCardPress}
    >
      {selected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.leadName} numberOfLines={1}>
          {lead.Name}
        </Text>
        
        <View style={styles.assignmentContainer}>
          {lead?.Assigned ? (
            <>
              <Text style={styles.assignedText}>
                Assigned to: <Text style={styles.assignedName}>{lead.Assigned.username}</Text>
              </Text>
              {lead.Assigned?.Avatar && !avatarError ? (
                <AuthenticatedImage
                  source={{
                    uri: `${process.env.EXPO_PUBLIC_BASE_URL || ""}${encodeURI(lead.Assigned.Avatar)}`,
                  }}
                  style={styles.avatar}
                  onError={(error) => {
                    console.log(`Avatar loading error for ${lead.Assigned.username}:`, {
                      originalPath: lead.Assigned.Avatar,
                      encodedPath: encodeURI(lead.Assigned.Avatar),
                      fullUri: `${process.env.EXPO_PUBLIC_BASE_URL || ""}${encodeURI(lead.Assigned.Avatar)}`,
                      error: error
                    });
                    setAvatarError(true);
                  }}
                  onLoad={() => {
                    console.log(`Avatar loaded successfully for ${lead.Assigned.username}: ${lead.Assigned.Avatar}`);
                  }}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={16} color="#9CA3AF" />
                </View>
              )}
            </>
          ) : (
            <Text style={styles.unassignedText}>Not assigned to any agent</Text>
          )}
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Status and Source Row */}
        <View style={styles.statusSourceRow}>
          <View style={styles.statusContainer}>
            <Text style={styles.fieldLabel}>Status:</Text>
            <StatusBadge status={lead.LeadStatus} />
          </View>
          
          <View style={styles.sourceContainer}>
            <Text style={styles.fieldLabel}>Source:</Text>
            <Text style={styles.sourceText}>{lead.Source?.Source || 'N/A'}</Text>
          </View>
        </View>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.fieldLabel}>Tags:</Text>
            <View style={styles.tagsRow}>
              {lead.tags.slice(0, 3).map((tag, index) => (
                <TagChip key={index} tag={tag} />
              ))}
              {lead.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{lead.tags.length - 3} more</Text>
              )}
            </View>
          </View>
        )}

        {/* Description */}
        {lead.Description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.fieldLabel}>Description:</Text>
            <Text style={styles.descriptionText} numberOfLines={2}>
              {lead.Description}
            </Text>
          </View>
        )}

        {/* Last Comment */}
        {lead.lastComment && (
          <View style={styles.commentContainer}>
            <Text style={styles.fieldLabel}>Last Comment:</Text>
            <Text style={styles.commentText} numberOfLines={2}>
              {lead.lastComment.Content}
            </Text>
            {lead.commentCount > 1 && (
              <TouchableOpacity onPress={onDetailsPress}>
                <Text style={styles.moreCommentsText}>
                  +{lead.commentCount - 1} more comments...
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            setShowContact(!showContact);
          }}
        >
          <Ionicons name="call" size={18} color="#6B7280" />
          <Text style={styles.actionButtonText}>Contact</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={(e) => {
            e.stopPropagation();
            onDetailsPress();
          }}
        >
          <Ionicons name="information-circle" size={18} color="#6B7280" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Section */}
      {showContact && (
        <View style={styles.contactSection}>
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactMethod}
              onPress={() => handlePhoneCall(lead.Phone)}
            >
              <Ionicons name="call" size={16} color="#3B82F6" />
              <Text style={styles.phoneText}>{lead.Phone}</Text>
            </TouchableOpacity>
            
            {lead.AltPhone && (
              <TouchableOpacity
                style={styles.contactMethod}
                onPress={() => handlePhoneCall(lead.AltPhone)}
              >
                <Ionicons name="call" size={16} color="#DC2626" />
                <Text style={styles.altPhoneText}>{lead.AltPhone}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => handleWhatsApp(lead.Phone)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </TouchableOpacity>
            
            {lead.AltPhone && (
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => handleWhatsApp(lead.AltPhone)}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
                <Text style={styles.whatsappText}>Alt WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {lead.lastCalled && (
            <View style={styles.lastCalledContainer}>
              <Text style={styles.lastCalledText}>
                Last called {formatTimeAgo(lead.lastCalled)}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 280,
  },
  selectedCard: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  leadName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  assignmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  assignedText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  assignedName: {
    fontWeight: "500",
    color: "#111827",
  },
  unassignedText: {
    fontSize: 14,
    color: "#6B7280",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  body: {
    padding: 12,
    flex: 1,
  },
  statusSourceRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  statusContainer: {
    flex: 1,
  },
  sourceContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  sourceText: {
    fontSize: 14,
    color: "#111827",
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tagChip: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  commentContainer: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  moreCommentsText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: "auto",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  divider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  actionButtonText: {
    marginLeft: 6,
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  contactSection: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    gap: 8,
  },
  contactMethod: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#DBEAFE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3B82F6",
    flex: 1,
  },
  phoneText: {
    marginLeft: 6,
    color: "#1E40AF",
    fontSize: 12,
    fontWeight: "500",
  },
  altPhoneText: {
    marginLeft: 6,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "500",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#DCFCE7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#10B981",
    flex: 1,
  },
  whatsappText: {
    marginLeft: 6,
    color: "#059669",
    fontSize: 12,
    fontWeight: "500",
  },
  lastCalledContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  lastCalledText: {
    fontSize: 11,
    color: "#6B7280",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "500",
  },
});

export default LeadCard;
