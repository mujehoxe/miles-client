import React, { useEffect, useState, useRef, useContext } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapComponent from "@/components/MapComponent";
import { DeviceContext } from "./_layout";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface AddressInfo {
  city: string;
  street: string;
}

export default function Index() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<AddressInfo>({ city: "", street: "" });
  const [loading, setLoading] = useState(true);
  const previousLocationRef = useRef<LocationData | null>(null);
  const deviceId = useContext(DeviceContext);

  const SENSITIVITY_THRESHOLD = 500;

  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== "granted") {
        console.log("Permission to access location in background was denied");
      }

      startLocationUpdates();
    };

    const fetchAndDisplayAddress = async (
      latitude: number,
      longitude: number
    ) => {
      const fetchedAddress = await getAddressInfo(latitude, longitude);
      setAddress(fetchedAddress);
    };

    const sendLocation = async (position: Location.LocationObject) => {
      const { latitude, longitude } = position.coords;
      const timestamp = new Date().toISOString();

      setLocation({ latitude, longitude });

      if (previousLocationRef.current) {
        const { latitude: prevLat, longitude: prevLng } =
          previousLocationRef.current;
        const distance = getDistance(prevLat, prevLng, latitude, longitude);

        if (distance > SENSITIVITY_THRESHOLD) {
          fetchAndDisplayAddress(latitude, longitude);
        }
      } else {
        fetchAndDisplayAddress(latitude, longitude);
      }

      previousLocationRef.current = { latitude, longitude };

      const data = {
        id: deviceId,
        latitude,
        longitude,
        timestamp,
      };

      try {
        const response = await fetch("http://65.20.87.36:8080/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const responseText = await response.text();
        console.log("Location sent successfully:", responseText);
      } catch (error) {
        console.error("Error sending location:", error);
      }

      setLoading(false);
    };

    const startLocationUpdates = async () => {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
          timeInterval: 10000,
        },
        sendLocation
      );
    };

    requestLocationPermission();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Fetching location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Current Location</Text>
      {location && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Latitude: {location.latitude}</Text>
          <Text style={styles.infoText}>Longitude: {location.longitude}</Text>
          <Text style={styles.infoText}>
            City: {address.city || "Resolving city..."}
          </Text>
          <Text style={styles.infoText}>
            Street: {address.street || "Resolving street..."}
          </Text>
        </View>
      )}
      <MapComponent location={location} />
    </View>
  );
}

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const getAddressInfo = async (
  latitude: number,
  longitude: number
): Promise<AddressInfo> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();

    const address = {
      city:
        data.address.city ||
        data.address.town ||
        data.address.village ||
        "Unknown City",
      street:
        data.address.road ||
        `${data.address.village} ${data.address.suburb}` ||
        "Unknown Street",
    };

    return address;
  } catch (error) {
    console.error("Error fetching address info:", error);
    return {
      city: "Unknown City",
      street: "Unknown Street",
    };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#000",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#fff",
    marginVertical: 5,
  },
  infoBox: { marginVertical: 16, height: 100 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
