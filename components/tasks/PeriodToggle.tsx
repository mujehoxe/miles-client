import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { PeriodType } from "../../types/tasks";

interface PeriodToggleProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

export const PeriodToggle: React.FC<PeriodToggleProps> = ({ period, onPeriodChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onPeriodChange("today")}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        <View
          style={[
            styles.button,
            period === "today" ? styles.activeButton : styles.inactiveButton,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              period === "today" ? styles.activeText : styles.inactiveText,
            ]}
          >
            Today
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onPeriodChange("week")}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        <View
          style={[
            styles.button,
            period === "week" ? styles.activeButton : styles.inactiveButton,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              period === "week" ? styles.activeText : styles.inactiveText,
            ]}
          >
            This Week
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#e6f0f8", // miles-50
    borderRadius: 12,
    padding: 4,
  },
  touchable: {
    flex: 1,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#176298", // miles-500
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveButton: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontWeight: "600",
  },
  activeText: {
    color: "#FFFFFF",
  },
  inactiveText: {
    color: "#124b68", // miles-700
  },
});
