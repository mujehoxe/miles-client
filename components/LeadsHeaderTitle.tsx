import React from 'react';
import { View, Text } from 'react-native';
import LeadTypeDropdown, { LeadType } from './LeadTypeDropdown';

interface LeadsHeaderTitleProps {
  selectedType: LeadType;
  onTypeChange: (type: LeadType) => void;
  disabled?: boolean;
}

export default function LeadsHeaderTitle({
  selectedType,
  onTypeChange,
  disabled = false,
}: LeadsHeaderTitleProps) {
  return (
    <View className="flex-row items-center">
      <Text className="text-lg font-semibold text-white mr-2">Leads -</Text>
      <LeadTypeDropdown
        selectedType={selectedType}
        onTypeChange={onTypeChange}
        disabled={disabled}
      />
    </View>
  );
}
