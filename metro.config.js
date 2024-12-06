// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("@expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts.push("cjs");

defaultConfig.resolver.extraNodeModules = {};

const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(defaultConfig, { input: "./global.css" });
