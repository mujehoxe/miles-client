import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function UserInfo({ user, location, address }) {
  return (
    <View>
      <Text style={{ ...styles.title, fontWeight: "800" }}>
        Hello {user.name},
      </Text>
      <View>
        <Text style={{ ...styles.infoText, fontWeight: "800" }}>
          Your Current Location
        </Text>

        {location?.latitude && (
          <Text style={styles.infoText}>Latitude: {location.latitude}</Text>
        )}
        {location?.latitude && (
          <Text style={styles.infoText}>Longitude: {location.longitude}</Text>
        )}
        {address.city && (
          <Text style={styles.infoText}>City: {address.city}</Text>
        )}
        {address.street && (
          <Text style={styles.infoText}>Street: {address.street}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "semibold",
    marginVertical: 10,
  },
  infoText: {
    fontSize: 16,
    marginVertical: 6,
  },
});
