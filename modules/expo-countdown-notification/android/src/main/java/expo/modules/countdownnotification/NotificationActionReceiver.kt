package expo.modules.countdownnotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.WorkManager
import java.util.UUID
import android.util.Log

class NotificationActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "STOP_COUNTDOWN", "DISMISS_COUNTDOWN" -> {
                val workerId = intent.getStringExtra("WORKER_ID")
                workerId?.let {
                    Log.d("NotificationActionReceiver", "Stopping worker: $it")
                    WorkManager.getInstance(context).cancelWorkById(UUID.fromString(it))
                    // Send a broadcast to stop the countdown immediately
                    val stopIntent = Intent("STOP_COUNTDOWN_IMMEDIATELY").apply {
                        putExtra("WORKER_ID", it)
                    }
                    context.sendBroadcast(stopIntent)
                }
            }
        }
    }
}