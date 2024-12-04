import LoadingView from "@/components/LoadingView";
import MapComponent from "@/components/MapComponent";
import UserInfo from "@/components/UserInfo";
import useLocation from "@/hooks/useLocation";
import useOneSignal from "@/hooks/useOneSignal";
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { UserContext } from "../_layout";

export default function Tab() {
  const user = useContext(UserContext);
  const { location, address } = useLocation(user);
  useOneSignal(user);

  if (!user || !location) return <LoadingView />;

  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <UserInfo user={user} location={location} address={address} />
      </View>
      <View style={styles.mapWrapper}>
        <MapComponent location={location} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 18,
  },
  userInfoContainer: {
    marginBottom: 12,
  },
  mapWrapper: {
    flex: 1,
  },
});
