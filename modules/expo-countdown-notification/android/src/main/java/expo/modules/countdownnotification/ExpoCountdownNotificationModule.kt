package expo.modules.countdownnotification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.work.Data
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoCountdownNotificationModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("ExpoCountdownNotification")
    }

    companion object {
        fun display(context: Context, eventTime: Long, title: String, message: String, keepAfterFor: Long?) {
            createNotificationChannel(context)

            val inputData = Data.Builder()
                .putLong("eventTime", eventTime)
                .putString("title", title)
                .putString("message", message)
                .putLong("keepAfterFor", keepAfterFor ?: 0L)
                .build()

            val workRequest = OneTimeWorkRequest.Builder(CountdownWorker::class.java)
                .setInputData(inputData)
                .build()

            WorkManager.getInstance(context).enqueue(workRequest)
        }

        private fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val name = "Countdown Notifications"
                val descriptionText = "Channel for countdown notifications"
                val importance = NotificationManager.IMPORTANCE_DEFAULT
                val channel = NotificationChannel("countdown_channel", name, importance).apply {
                    description = descriptionText
                }
                val notificationManager: NotificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
        }
    }

}