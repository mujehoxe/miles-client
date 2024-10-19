import LoadingView from "@/components/LoadingView";
import MapComponent from "@/components/MapComponent";
import UserLocationView from "@/components/UserLocationView";
import useLocation from "@/hooks/useLocation";
import useOneSignal from "@/hooks/useOneSignal";
import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { UserContext } from "./_layout";

export default function Index() {
  const user = useContext(UserContext);
  const { location, address } = useLocation(user);
  useOneSignal(user);

  if (!location) return <LoadingView />;

  return (
    <View style={styles.container}>
      {user && (
        <UserLocationView user={user} location={location} address={address} />
      )}
      <MapComponent location={location} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#000",
    justifyContent: "center",
  },
});
