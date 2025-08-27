package expo.modules.countdownnotification

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import android.util.Log
import android.view.View
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

class CountdownWorker(
    context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {
    private val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private val handler = Handler(Looper.getMainLooper())
    private var countdownJob: Runnable? = null
    private val isStopped = AtomicBoolean(false)

    companion object {
        private val notificationCounter = AtomicInteger(0)
    }

    private val notificationId = notificationCounter.incrementAndGet()

    override fun doWork(): Result {
        val eventTime = inputData.getLong("eventTime", 0L)
        val title = inputData.getString("title") ?: ""
        val message = inputData.getString("message") ?: ""
        val keepAfterFor = inputData.getLong("keepAfterFor", 0L)

        val currentTime = System.currentTimeMillis()
        val remainingTime = eventTime - currentTime

        startCountdown(remainingTime, title, message, keepAfterFor)

        while (!isStopped.get()) {
            Thread.sleep(1000)
        }

        return Result.success()
    }

    private fun startCountdown(initialRemainingTime: Long, title: String, messsage: String, keepAfterFor: Long) {
        var remainingTime = initialRemainingTime

        countdownJob = object : Runnable {
            override fun run() {
                if (isStopped.get()) {
                    handler.removeCallbacks(this)
                    notificationManager.cancel(notificationId)
                    return
                }

                showNotification(remainingTime, title, messsage)
                remainingTime -= 1000
                handler.postDelayed(this, 1000)

                if (remainingTime <= - keepAfterFor) {
                    isStopped.set(true)
                    handler.removeCallbacks(this)
                    notificationManager.cancel(notificationId)
                }
            }
        }

        handler.post(countdownJob!!)
    }

    private fun showNotification(remainingTime: Long, title: String, message: String) {
        val remoteViews = RemoteViews(applicationContext.packageName, R.layout.notification_layout)
        val expandedRemoteViews = RemoteViews(applicationContext.packageName, R.layout.notification_layout)

        val seconds = Math.abs(remainingTime / 1000) % 60
        val minutes = Math.abs(remainingTime / 1000) / 60

        val timeString = if (remainingTime < 0) {
            String.format("%02dm : %02ds ago", minutes, seconds)
        } else {
            String.format("In %02dm : %02ds", minutes, seconds)
        }

        remoteViews.setTextViewText(R.id.title, title)
        remoteViews.setTextViewText(R.id.chronometer, timeString)

        expandedRemoteViews.setTextViewText(R.id.title, title)
        expandedRemoteViews.setTextViewText(R.id.chronometer, timeString)
        expandedRemoteViews.setTextViewText(R.id.message, message)
        expandedRemoteViews.setViewVisibility(R.id.message, View.VISIBLE)

        val stopIntent = Intent(applicationContext, NotificationActionReceiver::class.java).apply {
            action = "STOP_COUNTDOWN"
            putExtra("WORKER_ID", id.toString())
            putExtra("NOTIFICATION_ID", notificationId)
        }

        val stopPendingIntent = PendingIntent.getBroadcast(
            applicationContext,
            notificationId,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val dismissIntent = Intent(applicationContext, NotificationActionReceiver::class.java).apply {
            action = "DISMISS_COUNTDOWN"
            putExtra("WORKER_ID", this@CountdownWorker.id.toString())
            putExtra("NOTIFICATION_ID", notificationId)
        }
        val dismissPendingIntent = PendingIntent.getBroadcast(
            applicationContext,
            notificationId + 1000000,  // Ensure this is different from the stopPendingIntent requestCode
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, "countdown_channel")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCustomContentView(remoteViews)
            .setCustomBigContentView(expandedRemoteViews)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setOnlyAlertOnce(true)
            .setAutoCancel(true)
            .setContentIntent(stopPendingIntent)
            .setDeleteIntent(dismissPendingIntent)
            .setVibrate(longArrayOf(0))
            .build()

        notificationManager.notify(notificationId, notification)
    }

    override fun onStopped() {
        super.onStopped()
        Log.d("CountdownWorker", "Worker stopped")
        isStopped.set(true)
        countdownJob?.let { handler.removeCallbacks(it) }
        notificationManager.cancel(notificationId)
    }

    private val stopReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "STOP_COUNTDOWN_IMMEDIATELY") {
                val receivedWorkerId = intent.getStringExtra("WORKER_ID")
                if (receivedWorkerId == id.toString()) {
                    Log.d("CountdownWorker", "Received stop broadcast")
                    isStopped.set(true)
                    onStopped()
                }
            }
        }
    }
}