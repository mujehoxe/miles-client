import ExpoCountdownNotificationModule from "expo-countdown-notification/src/ExpoCountdownNotificationModule";

export function display(
  reminderTime: number,
  title: string,
  keepAfterFor: number
): void {
  return ExpoCountdownNotificationModule.display(
    reminderTime,
    title,
    keepAfterFor
  );
}
