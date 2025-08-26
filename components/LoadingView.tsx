import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" className="text-miles-600" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
});
