import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimestamp } from '../utils/dateFormatter';
import AuthenticatedImage from './AuthenticatedImage';

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
  timestamp?: string;
  LeadAssignedDate?: string;
  lastCalled?: string;
}

interface CompactLeadCardProps {
  lead: Lead;
  onPress: () => void;
}

const CompactLeadCard: React.FC<CompactLeadCardProps> = ({ lead, onPress }) => {
  const [avatarError, setAvatarError] = useState(false);

  const getStatusColor = (color?: string) => {
    if (!color) return '#6B7280';
    // Handle both hex colors and named colors
    if (color.startsWith('#')) return color;
    return '#6B7280'; // Default gray if color format is not recognized
  };

  const formatDescription = (description?: string) => {
    if (!description) return '';
    return description.length > 100 
      ? description.substring(0, 100) + '...'
      : description;
  };

  const safeFormatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return formatTimestamp(timestamp);
    } catch (error) {
      console.warn('Error formatting timestamp:', timestamp, error);
      return '';
    }
  };

  // Safe rendering helpers
  const safeText = (text: any) => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return text.toString();
    return String(text);
  };

  return (
    <TouchableOpacity
      className="bg-white mx-4 mb-2 rounded-lg border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="p-3">
        {/* Header row with name and status */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {safeText(lead.Name) || 'Unknown Lead'}
            </Text>
            
            {/* Lead description - truncated */}
            {lead.Description && (
              <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                {formatDescription(safeText(lead.Description))}
              </Text>
            )}
          </View>
          
          {/* Status badge */}
          {lead.LeadStatus && (
            <View 
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: `${getStatusColor(lead.LeadStatus.color)}20` }}
            >
              <Text 
                className="text-xs font-medium"
                style={{ color: getStatusColor(lead.LeadStatus.color) }}
              >
                {safeText(lead.LeadStatus.Status) || 'Unknown Status'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom row with phone, source, and agent */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {/* Phone number */}
            {lead.Phone && !lead.Phone.startsWith('***') && (
              <View className="flex-row items-center mr-4">
                <Ionicons name="call" size={12} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
                  {safeText(lead.Phone)}
                </Text>
              </View>
            )}
            
            {/* Source */}
            {lead.Source && (
              <View className="flex-row items-center mr-4">
                <Ionicons name="flag" size={12} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
                  {safeText(lead.Source.Source)}
                </Text>
              </View>
            )}
          </View>

          {/* Assigned agent and timestamp */}
          <View className="flex-row items-center">
            {/* Assigned agent avatar */}
            {lead.Assigned && (
              <View className="flex-row items-center mr-2">
                {!avatarError && lead.Assigned.Avatar ? (
                  <AuthenticatedImage
                    source={{ uri: lead.Assigned.Avatar }}
                    style={{ width: 20, height: 20, borderRadius: 10 }}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <View className="w-5 h-5 rounded-full bg-gray-300 items-center justify-center">
                    <Text className="text-xs font-medium text-gray-600">
                      {safeText(lead.Assigned.username).charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Timestamp */}
            {lead.timestamp && (
              <Text className="text-xs text-gray-500">
                {safeFormatTimestamp(lead.timestamp)}
              </Text>
            )}
            
            {/* Chevron icon */}
            <View className="ml-1">
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </View>
        </View>

        {/* Comments indicator */}
        {lead.commentCount && lead.commentCount > 0 && (
          <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
            <Ionicons name="chatbubble-outline" size={12} color="#6B7280" />
            <Text className="text-xs text-gray-600 ml-1">
              {safeText(lead.commentCount)} comment{lead.commentCount !== 1 ? 's' : ''}
            </Text>
            
            {/* Last comment preview */}
            {lead.lastComment && (
              <Text className="text-xs text-gray-500 ml-2 flex-1" numberOfLines={1}>
                {safeText(lead.lastComment.Content)}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CompactLeadCard;
