import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';

interface UpdateDescriptionInputProps {
  isUpdateDescriptionInput: boolean;
  loading: boolean;
  onDescriptionChange: (description: string) => void;
  onSubmit: () => void;
  onReminderPress?: () => void;
  showReminderButton?: boolean;
  placeholder?: string;
}

const UpdateDescriptionInput: React.FC<UpdateDescriptionInputProps> = ({
  isUpdateDescriptionInput,
  loading,
  onDescriptionChange,
  onSubmit,
  onReminderPress,
  showReminderButton = false,
  placeholder = 'Describe your changes...',
}) => {
  const [description, setDescription] = useState('');
  const inputRef = useRef<TextInput>(null);
  
  // Focus the input when the component becomes visible
  useEffect(() => {
    if (isUpdateDescriptionInput && inputRef.current) {
      // Add a small delay to ensure the animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isUpdateDescriptionInput]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    onDescriptionChange(text);
  };

  const handleSubmit = () => {
    onSubmit();
    setDescription(''); // Clear input after submit
  };

  if (!isUpdateDescriptionInput) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="p-3 bg-gray-50 border-t border-gray-200"
    >
      <Text className="text-sm font-medium text-gray-500 mb-2">
        Comment
      </Text>
      
      <View className="flex-row items-center space-x-2">
        <TextInput
          ref={inputRef}
          value={description}
          onChangeText={handleDescriptionChange}
          placeholder={placeholder}
          multiline
          numberOfLines={2}
          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          placeholderTextColor="#9CA3AF"
          editable={!loading}
          blurOnSubmit={false}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (description.trim() && !loading) {
              handleSubmit();
            }
          }}
        />
        
        <View className="flex-row items-center space-x-2">
          {showReminderButton && onReminderPress && (
            <TouchableOpacity
              onPress={onReminderPress}
              disabled={loading}
              className={`p-2 rounded-lg ${loading ? 'opacity-50' : ''}`}
            >
              <Ionicons 
                name="notifications" 
                size={20} 
                color="#10B981" 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !description.trim()}
            className={`p-2 rounded-lg ${
              loading || !description.trim() ? 'opacity-50' : ''
            }`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color="#3B82F6" 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default UpdateDescriptionInput;
