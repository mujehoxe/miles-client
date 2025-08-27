import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

export default function useLocation(user) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState({
    city: null,
    street: null,
  });
  const [error, setError] = useState(null);
  const previousLocationRef = useRef(null);
  const watchSubscriptionRef = useRef(null);

  const SENSITIVITY_THRESHOLD = 500; // meters
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  useEffect(() => {
    if (user) requestLocationPermission();

    return () => {
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
      }
    };
  }, [user]);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }

      const backgroundStatus =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== "granted") {
        console.warn("Background location access denied");
      }

      await startLocationUpdates();
    } catch (err) {
      setError(`Permission error: ${err.message}`);
    }
  };

  const startLocationUpdates = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
          timeInterval: 10000,
        },
        handleLocationUpdate
      );
      watchSubscriptionRef.current = subscription;
    } catch (err) {
      setError(`Location update error: ${err.message}`);
    }
  };

  const handleLocationUpdate = async (position) => {
    try {
      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });

      const shouldUpdateAddress =
        !address.city ||
        !address.street ||
        (previousLocationRef.current &&
          getDistance(
            previousLocationRef.current.latitude,
            previousLocationRef.current.longitude,
            latitude,
            longitude
          ) > SENSITIVITY_THRESHOLD);

      if (shouldUpdateAddress) {
        const fetchedAddress = await retryOperation(
          () => reverseGeocode(latitude, longitude),
          MAX_RETRIES,
          RETRY_DELAY
        );
        setAddress(fetchedAddress);
      }

      previousLocationRef.current = { latitude, longitude };
      await sendLocationToServer(user.id, latitude, longitude);
    } catch (err) {
      console.error("Location update failed:", err);
      setError(`Location update failed: ${err.message}`);
    }
  };

  const retryOperation = async (operation, maxRetries, delay) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        if (attempt === maxRetries) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using Expo's Location.reverseGeocodeAsync instead of Nominatim
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const addressData = results[0];
        return {
          city:
            addressData.city ||
            addressData.subregion ||
            addressData.region ||
            "Unknown City",
          street: addressData.street || addressData.name || "Unknown Street",
          district: addressData.district || addressData.region || null,
          postalCode: addressData.postalCode || null,
          country: addressData.country || null,
        };
      }

      throw new Error("No address data found");
    } catch (err) {
      console.error("Geocoding error:", err);
      return {
        city: "Error fetching city",
        street: "Error fetching street",
        error: err.message,
      };
    }
  };

  const sendLocationToServer = async (userId, latitude, longitude) => {
    const timestamp = new Date().toISOString();
    const data = { agent_id: userId, latitude, longitude, timestamp };

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        console.log("Server response:", result);
      } else {
        const text = await response.text();
        console.log("Server response:", text);
      }
    } catch (error) {
      console.error("Error sending location:", error);
      throw error;
    }
  };

  return {
    location,
    address,
    error,
    // Add a manual refresh function if needed
    refreshLocation: () =>
      watchSubscriptionRef.current && startLocationUpdates(),
  };
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
