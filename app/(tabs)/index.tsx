import LeadCard from "@/components/LeadCard";
import LoadingView from "@/components/LoadingView";
import useOneSignal from "@/hooks/useOneSignal";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-root-toast";
import { UserContext } from "../_layout";

export default function Tab() {
  const user = useContext(UserContext);
  useOneSignal(user);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const getBaseURL = () => {
    switch (user?.role) {
      case "Admin":
      case "superAdmin":
        return `/api/Lead/get`;
      case "FOS":
        return `/api/Lead/FOS/${user.id}`;
      case "BusinessHead":
        return `/api/Lead/hiearchy?role=BusinessHead&userid=${user.id}`;
      case "PNL":
        return `/api/Lead/hiearchy?role=PNL&userid=${user.id}`;
      case "TL":
        return `/api/Lead/hiearchy?role=TL&userid=${user.id}`;
      case "ATL":
        return `/api/Lead/hiearchy?role=ATL&userid=${user.id}`;
      default:
        throw new Error("Invalid user role");
    }
  };

  const fetchLeads = async (searchText = "") => {
    setLoading(true);
    try {
      const body = {
        page: currentPage,
        limit: leadsPerPage,
        userid: user.id,
      };

      if (searchText.trim() !== "") {
        body.searchBoxFilters = ["LeadName"];
        body.searchTerm = searchText;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Lead/get`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      setLeads(data.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
      Toast.show("Error fetching leads: " + error, {
        duration: Toast.durations.LONG,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const delayedSearch = setTimeout(() => {
      if (searchTerm) fetchLeads(searchTerm);
      else fetchLeads();
    }, 500);

    return () => {
      clearTimeout(delayedSearch);
      isMounted = false;
    };
  }, [searchTerm]);

  if (!user) return <LoadingView />;

  return (
    <View style={styles.container} className="mx-2">
      <TextInput
        placeholder="Search..."
        onChangeText={(text: string) => {
          setSearchTerm(text);
        }}
        className="mt-2 rounded-md placeholder:text-[#837979] col-span-full !border border-slate-300 text-lg focus:outline-none transition-all duration-200 focus:shadow-md bg-white px-3 py-1"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : leads?.length > 0 ? (
        <ScrollView className="py-4">
          {leads.map((l) => (
            <LeadCard lead={l} onDetailsPress={() => console.log("details")} />
          ))}
        </ScrollView>
      ) : (
        <Text>"No leads found."</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfoContainer: {
    marginBottom: 12,
  },
  mapWrapper: {
    flex: 1,
  },
});
