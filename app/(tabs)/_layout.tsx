import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#176298" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Leads",
          tabBarIcon: ({ color }) => (
            <Ionicons name="git-network-sharp" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: "Location",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
