import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

interface TagProps {
  tag: {
    Tag: string;
    isNew?: boolean;
    isFresh?: boolean;
    isDeleted?: boolean;
  };
  editable?: boolean;
  onChange?: (text: string) => void;
  onDelete?: (deleted: boolean) => void;
  onTagClick?: (tag: any) => void;
}

const Tag: React.FC<TagProps> = ({
  tag,
  editable = false,
  onChange,
  onDelete,
  onTagClick,
}) => {
  const [isEditing, setIsEditing] = useState(tag?.isNew || false);
  const [editText, setEditText] = useState(tag?.Tag || "");

  useEffect(() => {
    setEditText(tag?.Tag || "");
  }, [tag?.Tag]);

  const handlePress = () => {
    if (editable) {
      setIsEditing(true);
    } else if (onTagClick && !tag?.isDeleted) {
      onTagClick(tag);
    }
  };

  const handleSave = () => {
    if (onChange && editText.trim()) {
      onChange(editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (tag?.isDeleted) {
      onDelete?.(false); // Restore
    } else {
      Alert.alert("Delete Tag", "Are you sure you want to delete this tag?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.(true),
        },
      ]);
    }
  };

  const getTagStyles = () => {
    if (tag?.isDeleted) {
      return "bg-red-100 border-red-200";
    }
    if (tag?.isNew) {
      return "bg-green-100 border-green-200";
    }
    return "bg-miles-50 border-miles-200";
  };

  const getTextStyles = () => {
    if (tag?.isDeleted) {
      return "text-red-700 line-through";
    }
    if (tag?.isNew) {
      return "text-green-700";
    }
    return "text-miles-700";
  };

  if (!tag) return null;

  if (isEditing) {
    return (
      <View
        className={`flex-row items-center rounded-md border px-2 py-1 ${getTagStyles()}`}
      >
        <TextInput
          value={editText}
          onChangeText={setEditText}
          onSubmitEditing={handleSave}
          onBlur={handleSave}
          autoFocus
          className="text-xs font-medium flex-1 min-w-[60px]"
          style={{ color: tag?.isNew ? "#059669" : "#1e40af" }}
        />
        <TouchableOpacity onPress={handleSave} className="ml-1">
          <Ionicons name="checkmark" size={12} color="#10b981" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <View
        className={`flex-row items-center rounded-md border px-2 py-1 ${getTagStyles()}`}
      >
        <Text className={`text-xs font-medium ${getTextStyles()}`}>
          {tag.Tag}
        </Text>
        {editable && (
          <TouchableOpacity onPress={handleDelete} className="ml-1">
            <Ionicons
              name={tag?.isDeleted ? "refresh" : "close"}
              size={12}
              color={tag?.isDeleted ? "#10b981" : "#ef4444"}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Tag;
