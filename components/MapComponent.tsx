import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { WebView } from "react-native-webview";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface MapComponentProps {
  location: LocationData | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ location }) => {
  const getOpenStreetMapIframe = (latitude: number, longitude: number) => {
    return `
      <iframe
        width="100%"
        height="100%"
        frameborder="0"
        style="border:0"
        src="https://www.openstreetmap.org/export/embed.html?bbox=${
          longitude - 0.01
        },${latitude - 0.01},${longitude + 0.01},${
      latitude + 0.01
    }&layer=mapnik&marker=${latitude},${longitude}"
        allowfullscreen>
      </iframe>
    `;
  };

  if (!location) {
    return null;
  }

  return (
    <View style={styles.mapContainer}>
      {Platform.OS === "ios" ? (
        <MapView
          style={styles.map}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
          />
        </MapView>
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{
            html: getOpenStreetMapIframe(location.latitude, location.longitude),
          }}
          style={styles.map}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: 700,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default MapComponent;
