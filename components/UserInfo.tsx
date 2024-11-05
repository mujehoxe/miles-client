import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function UserInfo({ user, location, address }) {
  return (
    <View>
      <Text style={styles.title}>
        <Text style={{ fontWeight: "800" }}>{user.name}</Text> Your Current
        Location
      </Text>
      <View>
        <Text style={styles.infoText}>Latitude: {location.latitude}</Text>
        <Text style={styles.infoText}>Longitude: {location.longitude}</Text>
        {console.log(address) ||
          (address.city && (
            <Text style={styles.infoText}>City: {address.city}</Text>
          ))}
        {address.street && (
          <Text style={styles.infoText}>Street: {address.street}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "semibold",
    marginBottom: 20,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#fff",
    marginVertical: 5,
  },
});
