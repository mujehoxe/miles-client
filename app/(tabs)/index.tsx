import LoadingView from "@/components/LoadingView";
import useOneSignal from "@/hooks/useOneSignal";
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { UserContext } from "../_layout";

export default function Tab() {
  const user = useContext(UserContext);
  useOneSignal(user);

  if (!user) return <LoadingView />;

  return <View style={styles.container}></View>;
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
