import React from "react";
import { ActivityIndicator } from "react-native";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config";

const fullConfig = resolveConfig(tailwindConfig);

const miles500 = fullConfig.theme.colors.miles[500];

export default function LoadingView() {
  return <ActivityIndicator size="large" color={miles500} />;
}
