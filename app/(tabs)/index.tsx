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
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from "../_layout";

export default function Tab() {
  const user = useContext(UserContext);
  
  useOneSignal(user);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  
  const fetchLeads = async (searchText = "") => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const storedToken = await SecureStore.getItemAsync("userToken");
      
      if (!storedToken) {
        Toast.show('Please login again to access leads', {
          duration: Toast.durations.LONG,
        });
        setLoading(false);
        return;
      }
      
      // Check if token is expired
      try {
        const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenExpiry = tokenPayload.exp;
        
        if (currentTime > tokenExpiry) {
          Toast.show('Your session has expired. Please login again.', {
            duration: Toast.durations.LONG,
          });
          await SecureStore.deleteItemAsync("userToken");
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        Toast.show('Invalid session token. Please login again.', {
          duration: Toast.durations.LONG,
        });
        await SecureStore.deleteItemAsync("userToken");
        setLoading(false);
        return;
      }
      
      const requestBody = {
        searchTerm: searchText.trim(),
        selectedAgents: user.role === 'superAdmin' ? [] : [user.id],
        selectedStatuses: [],
        selectedSources: [],
        selectedTags: [],
        date: [],
        dateFor: undefined,
        searchBoxFilters: ["LeadInfo"],
        page: currentPage + 1,
        limit: leadsPerPage.toString(),
        userid: user.id,
      };
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/Lead/get`, {
        method: "POST",
        headers: {
          "accept": "application/json, text/plain, */*",
          "content-type": "application/json",
          "Cookie": `token=${storedToken}`,
          "referer": `${process.env.EXPO_PUBLIC_API_URL}/Leads/Marketing`,
          "origin": `${process.env.EXPO_PUBLIC_API_URL}`,
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) MilesClient-Mobile/1.0.0",
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        const leadsData = data.data;
        
        if (Array.isArray(leadsData)) {
          setLeads(leadsData);
          console.log(`Successfully loaded ${leadsData.length} leads`);
        } else {
          setLeads([]);
        }
      } else {
        console.error(`API request failed with status ${response.status}`);
        setLeads([]);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      Toast.show("Error fetching leads: " + error.message, {
        duration: Toast.durations.LONG,
      });
      setLeads([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  useEffect(() => {
    if (!user) return; // Don't fetch if user is not available
    
    let isMounted = true;

    const delayedSearch = setTimeout(() => {
      if (searchTerm) fetchLeads(searchTerm);
      else fetchLeads();
    }, 500);

    return () => {
      clearTimeout(delayedSearch);
      isMounted = false;
    };
  }, [searchTerm, user]);

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
          {leads.map((l, index) => (
            <LeadCard key={l._id || index} lead={l} onDetailsPress={() => console.log("details")} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Leads Found</Text>
            <Text style={styles.emptyStateDescription}>
              {searchTerm ? 
                `No leads match your search "${searchTerm}"` : 
                'No leads are available at the moment'
              }
            </Text>
            {searchTerm && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchTerm('')}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  clearSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
