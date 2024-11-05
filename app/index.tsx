import LoadingView from "@/components/LoadingView";
import MapComponent from "@/components/MapComponent";
import UserInfo from "@/components/UserInfo";
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
        <View style={styles.userInfoContainer}>
          <UserInfo user={user} location={location} address={address} />
        </View>
      )}
      <View style={styles.mapWrapper}>
        <MapComponent location={location} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 46,
    paddingBottom: 18,
    height: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  userInfoContainer: {
    marginBottom: 18,
  },
  mapWrapper: {
    flex: 1,
  },
});
