import { logout } from "@/services/api/auth";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LogoutContext } from "../app/_layout";

interface LogoutButtonProps {
  onLogout?: () => void;
  style?: "button" | "menuItem";
  showText?: boolean;
  color?: string;
  size?: "small" | "medium" | "large";
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogout,
  style = "button",
  showText = true,
  color = "#DC2626",
  size = "medium",
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const contextLogout = useContext(LogoutContext);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoggingOut(true);

              // Call the server logout first
              await logout();

              // Then call the context logout to clean up local state
              if (contextLogout) {
                await contextLogout();
              }

              // Finally call the optional callback
              onLogout?.();
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const textSizes = {
    small: 12,
    medium: 14,
    large: 16,
  };

  const paddingClass =
    size === "small"
      ? "px-3 py-2"
      : size === "large"
      ? "px-5 py-3"
      : "px-4 py-2.5";
  const opacityClass = isLoggingOut ? "opacity-60" : "opacity-100";

  if (style === "menuItem") {
    return (
      <TouchableOpacity
        className={`py-3 px-4 ${opacityClass}`}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        <View className="flex-row items-center">
          <Ionicons
            name="log-out-outline"
            size={iconSizes[size]}
            color={color}
          />
          {showText && (
            <Text
              className="font-medium flex-1 ml-3"
              style={{ color, fontSize: textSizes[size] }}
            >
              Sign Out
            </Text>
          )}
          {isLoggingOut && (
            <ActivityIndicator size="small" color={color} className="ml-2" />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className={`border-2 rounded-lg bg-transparent ${paddingClass} ${opacityClass}`}
      style={{ borderColor: color }}
      onPress={handleLogout}
      disabled={isLoggingOut}
    >
      <View className="flex-row items-center justify-center">
        <Ionicons name="log-out-outline" size={iconSizes[size]} color={color} />
        {showText && (
          <Text
            className="font-medium ml-2"
            style={{ color, fontSize: textSizes[size] }}
          >
            Sign Out
          </Text>
        )}
        {isLoggingOut && (
          <ActivityIndicator size="small" color={color} className="ml-2" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default LogoutButton;
