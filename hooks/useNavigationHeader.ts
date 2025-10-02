import { LeadType } from "@/components/LeadTypeDropdown";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, Text } from "react-native";

interface UseNavigationHeaderProps {
  leadType: LeadType;
  onHeaderPress: () => void;
}

export const useNavigationHeader = ({
  leadType,
  onHeaderPress,
}: UseNavigationHeaderProps) => {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const displayType = leadType.charAt(0).toUpperCase() + leadType.slice(1);

      navigation.setOptions({
        headerTitle: () =>
          React.createElement(
            Pressable,
            {
              style: {
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                width: "100%",
              },
              onPress: () => onHeaderPress(),
            },
            [
              React.createElement(
                Text,
                {
                  key: "header-text",
                  style: {
                    color: "#000000",
                    fontSize: 20,
                    fontWeight: "500",
                  },
                },
                `${displayType} Leads`
              ),
              React.createElement(Ionicons, {
                key: "header-icon",
                name: "chevron-down",
                size: 16,
                color: "#000000",
                style: {
                  marginLeft: 4,
                  paddingRight: 20,
                },
              }),
            ]
          ),
      });
    }, [navigation, leadType, onHeaderPress])
  );
};
