import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";
import { addLeadComment, fetchLeadComments } from "../../services/api";
import { formatTimestamp } from "../../utils/dateFormatter";

interface Lead {
  _id: string;
  Name: string;
}

interface Comment {
  _id: string;
  Content: string;
  User?: {
    username: string;
    Avatar?: string;
  };
  timestamp: string;
}

interface CommentsTabProps {
  lead: Lead;
}

const CommentsTab: React.FC<CommentsTabProps> = ({ lead }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const loadComments = async () => {
      if (!lead._id) return;

      try {
        setLoading(true);
        const fetchedComments = await fetchLeadComments(lead._id);
        setComments(fetchedComments);
      } catch (error) {
        console.error(error);
        Toast.show("Failed to load comments", {
          duration: Toast.durations.SHORT,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!adding) {
      loadComments();
    }
  }, [lead._id, adding]);

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setSending(true);
      await addLeadComment(lead._id, newComment.trim());
      setNewComment("");
      setAdding(false);
      Toast.show("Comment added successfully", {
        duration: Toast.durations.SHORT,
      });
    } catch (error) {
      console.error(error);
      Toast.show("Failed to add comment", {
        duration: Toast.durations.SHORT,
      });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setNewComment("");
  };

  const renderComment = (comment: Comment, index: number) => (
    <View key={comment._id || index} className="mb-4 bg-gray-50 rounded-lg p-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          {comment.User?.Avatar ? (
            <View className="w-8 h-8 rounded-full bg-miles-100 items-center justify-center mr-2">
              <Ionicons name="person" size={16} color="#3B82F6" />
            </View>
          ) : (
            <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2">
              <Ionicons name="person" size={16} color="#6B7280" />
            </View>
          )}
          <Text className="text-sm font-medium text-gray-800">
            {comment.User?.username || "Unknown User"}
          </Text>
        </View>
        <Text className="text-xs text-gray-500">
          {formatTimestamp(comment.timestamp)}
        </Text>
      </View>
      <Text className="text-sm text-gray-700 leading-5">{comment.Content}</Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-2">Loading comments...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {comments.length === 0 && !adding ? (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2 text-center">
              No Comments Yet
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6">
              Be the first to add a comment for this lead.
            </Text>
          </View>
        ) : (
          <View className="pb-4">
            {comments.map((comment, index) => renderComment(comment, index))}

            {adding && (
              <View className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Add Comment
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  placeholder="Write your comment here..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                />
                <View className="flex-row justify-end gap-2 mt-3">
                  <TouchableOpacity
                    onPress={handleCancel}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    disabled={sending}
                  >
                    <Text className="text-gray-700 font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    className="px-4 py-2 bg-miles-500 rounded-lg flex-row items-center"
                    disabled={sending || !newComment.trim()}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="send" size={16} color="white" />
                    )}
                    <Text className="text-white font-medium ml-1">
                      {sending ? "Sending..." : "Send"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Comment Button */}
      {!adding && (
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => setAdding(true)}
            className="bg-miles-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Add Comment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CommentsTab;
