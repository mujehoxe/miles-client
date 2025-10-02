import { useEffect } from "react";
import OneSignal from "react-native-onesignal";

const ONE_SIGNAL_APP_ID = "d1134921-c416-419e-a0a7-0c98e2640e2a";

interface User {
  id: string;
}

export default function useOneSignal(user: User | null) {
  useEffect(() => {
        if (user) setupOneSignal();
  }, [user]);

  async function setupOneSignal() {
    OneSignal.setAppId(ONE_SIGNAL_APP_ID);

    OneSignal.promptForPushNotificationsWithUserResponse((response) => {
          });

    OneSignal.setNotificationWillShowInForegroundHandler(
      (notificationReceivedEvent) => {
        try {
          const notification = notificationReceivedEvent.getNotification();
          const data = notification.additionalData;

          if (data?.type === "reminder") {
            return;
          }

          notificationReceivedEvent.complete(notification);
        } catch (err) {
          console.error("OneSignal error:", err);
        }
      }
    );

    // Trigger the subscription
    OneSignal.disablePush(false);

    return () => {
      OneSignal.clearHandlers();
    };
  }

  const sendPlayerIdToServer = async (userId: string, playerId: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/users/update-player-id`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, playerId }),
        }
      );
    } catch (error) {
      console.error(error);
    }
  };
}
