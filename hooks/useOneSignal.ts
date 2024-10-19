import notifee from "@notifee/react-native";
import { useEffect } from "react";
import OneSignal from "react-native-onesignal";

const ONE_SIGNAL_APP_ID = "d1134921-c416-419e-a0a7-0c98e2640e2a";

export default function useOneSignal(user) {
  useEffect(() => {
    if (user) {
      console.log(user);
      setupOneSignal();
    }
  }, [user]);

  async function setupOneSignal() {
    OneSignal.setAppId(ONE_SIGNAL_APP_ID);

    OneSignal.promptForPushNotificationsWithUserResponse((response) => {
      console.log("User's response to notification prompt:", response);
    });

    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
    });

    OneSignal.setNotificationWillShowInForegroundHandler(
      (notificationReceivedEvent) => {
        console.log(
          "OneSignal: notification will show in foreground:",
          notificationReceivedEvent
        );
        const notification = notificationReceivedEvent.getNotification();
        const data = notification.additionalData;
        console.log("Notification Data:", data);

        if (data?.type === "reminder") {
          const reminderTime = new Date(data.dateTime).getTime();
          notifee.displayNotification({
            title: "Message from Sarah Lane",
            body: notification.contentAvailable,
            subtitle: "Messages",
            android: {
              channelId,
              timestamp: reminderTime,
              showTimestamp: true,
              showChronometer: true,
              chronometerDirection: "down",
            },
          });
          return;
        }

        notificationReceivedEvent.complete(notification);
      }
    );

    OneSignal.getDeviceState().then((deviceState) => {
      console.log("Device State:", deviceState);
      if (!deviceState?.isSubscribed) {
        console.log("Device not subscribed. Attempting to subscribe...");
        OneSignal.addSubscriptionObserver((event) => {
          if (event.to.isSubscribed) {
            console.log("Successfully subscribed with ID:", event.to.userId);
            sendPlayerIdToServer(user?.id, event.to.userId);
          }
        });
        // Trigger the subscription
        OneSignal.disablePush(false);
      } else {
        console.log("Device already subscribed with ID:", deviceState.userId);
        sendPlayerIdToServer(user?.id, deviceState.userId);
      }
    });

    return () => {
      OneSignal.clearHandlers();
    };
  }

  const sendPlayerIdToServer = async (userId, playerId) => {
    try {
      await fetch(
        "https://crm.milestonehomesrealestate.com/api/users/update-player-id",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, playerId }),
        }
      );
    } catch (error) {
      console.error("Error updating Player ID:", error);
    }
  };
}
