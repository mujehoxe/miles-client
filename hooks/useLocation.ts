import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

export default function useLocation(user) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState({ city: "", street: "" });
  const previousLocationRef = useRef(null);

  const SENSITIVITY_THRESHOLD = 500;

  useEffect(() => {
    if (user) requestLocationPermission();
  }, [user]);

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    await Location.requestBackgroundPermissionsAsync();
    startLocationUpdates();
  };

  const startLocationUpdates = async () => {
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 1,
        timeInterval: 10000,
      },
      handleLocationUpdate
    );
  };

  const handleLocationUpdate = async (position) => {
    const { latitude, longitude } = position.coords;
    setLocation({ latitude, longitude });

    if (
      previousLocationRef.current &&
      getDistance(
        previousLocationRef.current.latitude,
        previousLocationRef.current.longitude,
        latitude,
        longitude
      ) > SENSITIVITY_THRESHOLD
    ) {
      const fetchedAddress = await getAddressInfo(latitude, longitude);
      setAddress(fetchedAddress);
    }

    previousLocationRef.current = { latitude, longitude };
    sendLocationToServer(user.id, latitude, longitude);
  };

  const sendLocationToServer = async (userId, latitude, longitude) => {
    const timestamp = new Date().toISOString();
    const data = { agent_id: userId, latitude, longitude, timestamp };
    try {
      const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      console.log(data.agent_id);
      console.log(await res.text());
    } catch (error) {
      console.error("Error sending location:", error);
    }
  };

  return { location, address };
}

export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getAddressInfo = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    return {
      city: data.address.city || "Unknown City",
      street: data.address.road || "Unknown Street",
    };
  } catch {
    return { city: "Unknown City", street: "Unknown Street" };
  }
};
