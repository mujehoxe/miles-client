import React from "react";
import { ActivityIndicator, View } from "react-native";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config";

const fullConfig = resolveConfig(tailwindConfig);

const miles700 = fullConfig.theme.colors.miles[900];

export default function LoadingView() {
  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={miles700} />
    </View>
  );
}
