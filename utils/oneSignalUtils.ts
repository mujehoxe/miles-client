import { OneSignal } from "react-native-onesignal";

/**
 * Unsubscribe from OneSignal notifications and clear user data
 * Should be called when user logs out
 */
export const unsubscribeFromOneSignal = async (): Promise<void> => {
  try {
    console.log("Unsubscribing from OneSignal...");

    // Log out from OneSignal (clears user identification)
    OneSignal.logout();
    console.log("OneSignal logout called");

    // Opt out from push notifications
    OneSignal.User.pushSubscription.optOut();
    console.log("OneSignal push subscription opted out");

    // Remove all aliases (including external_id)
    OneSignal.User.removeAliases(["external_id"]);
    console.log("OneSignal aliases removed");

  } catch (error) {
    console.error("Error unsubscribing from OneSignal:", error);
    // Don't throw error to prevent logout interruption
  }
};