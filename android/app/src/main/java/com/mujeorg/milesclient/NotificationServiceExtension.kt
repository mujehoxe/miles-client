package com.mujeorg.milesclient

import android.content.Context
import android.util.Log
import com.onesignal.OSNotification
import com.onesignal.OSNotificationReceivedEvent
import com.onesignal.OneSignal.OSRemoteNotificationReceivedHandler
import expo.modules.countdownnotification.ExpoCountdownNotificationModule
import java.text.SimpleDateFormat
import java.util.Date
import java.util.TimeZone

class NotificationServiceExtension : OSRemoteNotificationReceivedHandler {

    override fun remoteNotificationReceived(context: Context, notificationReceivedEvent: OSNotificationReceivedEvent) {
        val notification: OSNotification = notificationReceivedEvent.notification

        Log.d("NotificationService", notification.toString())

        try {
            var type = notification.additionalData.getString("type")
            if (notificationCallback != null && type == "reminder") {
                notificationCallback?.invoke(context, notification)
                return
            }
        } catch (err: Exception) {
            Log.d("NotificationService", err.toString())
        }

        notificationReceivedEvent.complete(notification)
    }

    companion object {
        // Define a callback function type
        var notificationCallback: ((Context, OSNotification) -> Unit)? = { context, notification ->
            val comment = notification.additionalData.getString("comment")
            val eventTime = getEventTime(notification)
            // Call the static display function from ExpoCountdownNotificationModule
            ExpoCountdownNotificationModule.display(
                context,
                eventTime = eventTime,
                title = notification.title ?: "Default Title",
                message = comment,
                keepAfterFor = 60000L // Customize this value as needed
            )
        }

        private fun getEventTime(notification: OSNotification): Long {
            val eventDateTime = notification.additionalData.getString("dateTime")

            val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            dateFormat.timeZone = TimeZone.getTimeZone("UTC") // Set timezone to UTC

            val date: Date = dateFormat.parse(eventDateTime)

            return date.time
        }
    }
}
