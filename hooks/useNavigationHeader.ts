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
              },
              onPress: () => {
                console.log("Header title pressed");
                onHeaderPress();
              },
            },
            [
              React.createElement(
                Text,
                {
                  style: {
                    color: "#000000",
                    fontSize: 20,
                    fontWeight: "500",
                    marginRight: 6,
                  },
                },
                `${displayType} Leads`
              ),
              React.createElement(Ionicons, {
                name: "chevron-down",
                size: 16,
                color: "#000000",
              }),
            ]
          ),
      });
    }, [navigation, leadType, onHeaderPress])
  );
};
