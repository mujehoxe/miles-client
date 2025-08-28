import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface WhatsAppTemplateModalProps {
  isVisible: boolean;
  onClose: () => void;
  phoneNumber: string | null;
  leadName?: string;
  onSendMessage: (phoneNumber: string, message: string) => void;
}

const predefinedTemplates = [
  {
    id: 1,
    title: 'Initial Contact',
    message: 'Hello! I\'m reaching out regarding your recent inquiry. When would be a good time to discuss your requirements?'
  },
  {
    id: 2,
    title: 'Follow Up',
    message: 'Hi! Following up on our previous conversation. Do you have any questions or would you like to schedule a meeting?'
  },
  {
    id: 3,
    title: 'Meeting Reminder',
    message: 'This is a reminder about our scheduled meeting. Looking forward to speaking with you!'
  },
  {
    id: 4,
    title: 'Information Request',
    message: 'Could you please provide some additional information about your requirements so I can better assist you?'
  },
];

const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isVisible,
  onClose,
  phoneNumber,
  leadName,
  onSendMessage,
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const handleTemplateSelect = (template: typeof predefinedTemplates[0]) => {
    setSelectedTemplate(template.id);
    setCustomMessage(template.message);
  };

  const handleSend = () => {
    if (!phoneNumber || !customMessage.trim()) return;
    
    // Replace placeholder with actual lead name if available
    const finalMessage = leadName 
      ? customMessage.replace(/\[NAME\]/g, leadName)
      : customMessage;
    
    onSendMessage(phoneNumber, finalMessage);
    onClose();
    setCustomMessage('');
    setSelectedTemplate(null);
  };

  const handleClose = () => {
    onClose();
    setCustomMessage('');
    setSelectedTemplate(null);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-lg max-h-[80%]">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                WhatsApp Message
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Phone Number Display */}\n              <View className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <View className="flex-row items-center">
                  <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
                  <Text className="ml-2 text-sm font-medium text-gray-700">
                    Sending to: {phoneNumber}
                  </Text>
                </View>
                {leadName && (
                  <Text className="text-sm text-gray-600 mt-1">
                    Lead: {leadName}
                  </Text>
                )}
              </View>

              {/* Template Selection */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Quick Templates:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {predefinedTemplates.map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        onPress={() => handleTemplateSelect(template)}
                        className={`px-3 py-2 rounded-lg border ${
                          selectedTemplate === template.id
                            ? 'bg-miles-50 border-miles-500'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            selectedTemplate === template.id
                              ? 'text-miles-700'
                              : 'text-gray-700'
                          }`}
                        >
                          {template.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Custom Message Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Message:
                </Text>
                <TextInput
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  placeholder="Type your message here..."
                  multiline
                  numberOfLines={6}
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-900 min-h-[120px]"
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
                {leadName && (
                  <Text className="text-xs text-gray-500 mt-1">
                    Tip: Use [NAME] to insert the lead's name
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View className="flex-row p-4 border-t border-gray-200 gap-3">
              <TouchableOpacity
                onPress={handleClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg"
              >
                <Text className="text-center text-sm font-medium text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSend}
                disabled={!phoneNumber || !customMessage.trim()}
                className={`flex-1 py-3 px-4 rounded-lg ${
                  !phoneNumber || !customMessage.trim()
                    ? 'bg-gray-300'
                    : 'bg-green-500'
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons 
                    name="logo-whatsapp" 
                    size={16} 
                    color="white" 
                  />
                  <Text className="ml-2 text-center text-sm font-medium text-white">
                    Send Message
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default WhatsAppTemplateModal;
