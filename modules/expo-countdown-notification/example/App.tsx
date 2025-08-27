import * as Settings from "expo-countdown-notification";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Theme: {
          Settings.display(Date.now() + 20000, `Close on countdown end`, 0)
      }{
          Settings.display(Date.now() + 20000, `Keep for extra 10s`, 10000)
      }</Text>
    </View>
  );
}
