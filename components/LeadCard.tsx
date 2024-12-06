import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LeadCard = ({ lead, onDetailsPress }) => {
  const [showContact, setShowContact] = useState(false);

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

  return (
    <View style={styles.card}>
      {/* Lead Header */}
      <View style={styles.header}>
        <Text style={styles.leadName} numberOfLines={1}>
          {lead.Name}
        </Text>

        <View style={styles.assignmentContainer}>
          {lead?.Assigned ? (
            <>
              <Text style={styles.assignedText}>
                Assigned to: {lead?.Assigned.username}
              </Text>
              {lead?.Assigned?.Avatar ? (
                <Image
                  source={{
                    uri: `${process.env.EXPO_PUBLIC_BASE_URL || ""}${
                      lead?.Assigned.Avatar
                    }`,
                  }}
                  style={styles.avatar}
                />
              ) : null}
            </>
          ) : (
            <Text style={styles.unassignedText}>Not assigned</Text>
          )}
        </View>
      </View>

      {/* Lead Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>
          Status: {lead.LeadStatus?.Status || "N/A"}
        </Text>
        <Text style={styles.sectionTitle}>
          Source: {lead.Source?.Source || "N/A"}
        </Text>

        <View style={styles.tagsSection}>
          <Text style={styles.tagTitle}>Marketing Tags:</Text>
          <Text style={styles.tagValues}>
            {lead.marketingtags?.map((t) => (
              <Text
                style={{
                  backgroundColor: "#cce0f2",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                {t.Tag}
              </Text>
            )) || "No tags"}
          </Text>
        </View>

        <View style={styles.tagsSection}>
          <Text style={styles.tagTitle}>DLD Tags:</Text>
          <Text style={styles.tagValues}>
            {lead.tags?.map((t) => (
              <Text
                style={{
                  backgroundColor: "#cce0f2",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                {t.Tag}
              </Text>
            )) || "No tags"}
          </Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Description:</Text>
          <Text style={styles.descriptionText} numberOfLines={3}>
            {lead.Description || "No Description"}
          </Text>
        </View>
      </View>

      {/* Contact Actions */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowContact(!showContact)}
        >
          <Ionicons name="call-sharp" size={20} color="#6B7280" />
          <Text style={styles.actionButtonText}>Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onDetailsPress}>
          <Ionicons name="information-circle-sharp" size={24} color="#6B7280" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </View>

      {showContact && (
        <View style={styles.contactSection}>
          <TouchableOpacity
            style={styles.contactMethod}
            onPress={() => handlePhoneCall(lead.Phone)}
          >
            <Ionicons name="call-sharp" size={16} color="#2563EB" />
            <Text style={styles.contactMethodText}>{lead.Phone}</Text>
          </TouchableOpacity>

          {lead.AltPhone && (
            <TouchableOpacity
              style={styles.contactMethod}
              onPress={() => handlePhoneCall(lead.AltPhone)}
            >
              <Ionicons name="call-sharp" size={16} color="#DC2626" />
              <Text style={styles.contactMethodText}>{lead.AltPhone}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.contactMethod}
            onPress={() => handleWhatsApp(lead.Phone)}
          >
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </TouchableOpacity>

          {lead.AltPhone && (
            <TouchableOpacity
              style={styles.contactMethod}
              onPress={() => handleWhatsApp(lead.AltPhone)}
            >
              <Text style={styles.whatsappText}>Alt WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  unassignedText: {
    fontSize: 14,
    color: "#6B7280",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  detailsContainer: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  tagsSection: {
    marginTop: 8,
  },
  tagTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  tagValues: {
    fontSize: 14,
    color: "#1F2937",
  },
  descriptionContainer: {
    marginTop: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#374151",
  },
  actionContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  actionButtonText: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 14,
  },
  contactSection: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  contactMethod: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  contactMethodText: {
    marginLeft: 8,
    color: "#1F2937",
  },
  whatsappText: {
    color: "#10B981",
    fontWeight: "500",
  },
});

export default LeadCard;
