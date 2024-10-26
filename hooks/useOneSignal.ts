import { useEffect } from "react";
import OneSignal from "react-native-onesignal";

import * as CountdownNotification from "expo-countdown-notification/src";

const ONE_SIGNAL_APP_ID = "d1134921-c416-419e-a0a7-0c98e2640e2a";

export default function useOneSignal(user) {
  useEffect(() => {
    console.log(user);
    if (user) setupOneSignal();
  }, [user]);

  async function setupOneSignal() {
    OneSignal.setAppId(ONE_SIGNAL_APP_ID);

    OneSignal.promptForPushNotificationsWithUserResponse((response) => {
      console.log("User's response to notification prompt:", response);
    });

    OneSignal.setNotificationWillShowInForegroundHandler(
      (notificationReceivedEvent) => {
        try {
          const notification = notificationReceivedEvent.getNotification();
          const data = notification.additionalData;
          console.log("Notification Data:", data);

          if (data?.type === "reminder") {
            const reminderTime = new Date(data.dateTime);

            const title = `Scheduled reminder for "${
              data.leadName
            }" at ${reminderTime.toLocaleTimeString().slice(0, -3)}`;

            CountdownNotification.display(
              reminderTime.getTime(),
              title,
              5 * 60 * 1000
            );

            notificationReceivedEvent.complete();
            return;
          }

          notificationReceivedEvent.complete(notification);
        } catch (err) {
          console.log(err);
        }
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
