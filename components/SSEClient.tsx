// SSEClient.js
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import EventSource from "react-native-sse";

const BACKGROUND_FETCH_TASK = "background-fetch-task";
const url = "http://192.168.54.3:3000/api/sse-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const handleMessage = async (event) => {
  console.log("Received SSE message:", event);
  try {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case "connected":
        console.log("SSE connection established. Connection ID:", data.id);
        break;
      case "NEW_ACTIVITY_LOG":
        const {
          action,
          timestamp,
          Userid,
          LeadId,
          previousValue,
          newValue,
          description,
        } = data.data;

        const notificationTitle = `${action} by ${
          Userid?.username || "Unknown User"
        }${previousValue ? ` from ${previousValue}` : ""}${
          newValue ? ` to ${newValue}` : ""
        }`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: notificationTitle,
            body: description,
            data: { timestamp, userId: Userid?._id, leadId: LeadId?._id },
          },
          trigger: null,
        });
    }
  } catch (error) {
    console.error("Error processing SSE message:", error);
  }
};

const SSEClient = () => {
  const eventSourceRef = useRef(null);

  const connectSSE = () => {
    console.log("Creating EventSource...");
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("open", () => {
      console.log("SSE connection opened");
    });

    eventSource.addEventListener("message", handleMessage);

    eventSource.addEventListener("error", (error) => {
      console.error("SSE error:", error);
      if (error) {
        console.error("EventSource failed:", error.target?.readyState);
      }
      eventSource.close();
      setTimeout(connectSSE, 5000); // Attempt to reconnect after 5 seconds
    });
  };

  useEffect(() => {
    (async () => {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Notification permissions not granted");
      }

      connectSSE();

      return () => {
        console.log("Closing SSE connection");
        if (eventSourceRef.current) {
          eventSourceRef.current.removeEventListener("message", handleMessage);
          eventSourceRef.current.close();
        }
      };
    })();
  }, []);

  return null;
};

export default SSEClient;
