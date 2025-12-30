package com.maxdrive.app;

import android.Manifest;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import java.io.InputStream;
import java.io.File;
import java.io.FileInputStream;
import java.util.UUID;
import android.webkit.WebView;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.MediaMetadata;
import android.media.session.PlaybackState;
import java.util.List;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.Set;

@SuppressWarnings("unused")
class WebAppInterface {
    private final BridgeActivity activity;
    private final WebView webView;
    private final DownloadManager downloadManager;
    private long currentDownloadId = -1;
    private DownloadCompleteReceiver downloadReceiver;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket obdSocket;
    private InputStream obdInputStream;
    private Thread obdThread;
    private volatile boolean obdRunning = false;
    private final MediaSessionManager mediaSessionManager;
    private final MediaSessionManager.OnActiveSessionsChangedListener sessionsListener;

    WebAppInterface(BridgeActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.downloadManager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        this.bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        this.mediaSessionManager = (MediaSessionManager) activity.getSystemService(Context.MEDIA_SESSION_SERVICE);

        if (this.mediaSessionManager != null) {
            MediaSessionManager.OnActiveSessionsChangedListener l = new MediaSessionManager.OnActiveSessionsChangedListener() {
                @Override
                public void onActiveSessionsChanged(List<MediaController> controllers) {
                    try {
                        String media = getCurrentMedia();
                        MediaNotificationListener.setCachedMedia(media);
                    } catch (Exception ignored) {}
                }
            };

            this.sessionsListener = l;

            try {
                ComponentName componentName = new ComponentName(activity, MediaNotificationListener.class);
                this.mediaSessionManager.addOnActiveSessionsChangedListener(this.sessionsListener, componentName);
            } catch (Exception e) {
                try { this.mediaSessionManager.addOnActiveSessionsChangedListener(this.sessionsListener, null); } catch (Exception ignored) {}
            }
        } else {
            this.sessionsListener = null;
        }
    }

    @JavascriptInterface
    public String getInstalledApps() {
        PackageManager pm = activity.getPackageManager();
        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        
        List<ResolveInfo> apps = pm.queryIntentActivities(intent, 0);
        JSONArray jsonArray = new JSONArray();
        Set<String> seenPackages = new HashSet<>();

        for (ResolveInfo resolveInfo : apps) {
            String packageName = resolveInfo.activityInfo.packageName;
            
            if (seenPackages.contains(packageName)) continue;
            seenPackages.add(packageName);

            try {
                JSONObject obj = new JSONObject();
                String appName = resolveInfo.loadLabel(pm).toString();
                String iconBase64 = getIconAsBase64(resolveInfo.loadIcon(pm));
                
                boolean isSystemApp = (resolveInfo.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                
                obj.put("name", appName);
                obj.put("packageName", packageName);
                obj.put("icon", iconBase64);
                obj.put("category", isSystemApp ? "System" : "App");
                jsonArray.put(obj);
            } catch (JSONException ignored) {
            }
        }
        return jsonArray.toString();
    }

    private String getIconAsBase64(Drawable icon) {
        try {
            Bitmap bitmap = drawableToBitmap(icon);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 85, baos);
            byte[] bytes = baos.toByteArray();
            return "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);
        } catch (Exception e) {
            return "";
        }
    }

    private Bitmap drawableToBitmap(Drawable drawable) {
        if (drawable instanceof BitmapDrawable bitmapDrawable) {
            if (bitmapDrawable.getBitmap() != null) {
                return bitmapDrawable.getBitmap();
            }
        }

        Bitmap bitmap;
        if (drawable.getIntrinsicWidth() <= 0 || drawable.getIntrinsicHeight() <= 0) {
            bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
        } else {
            int size = Math.min(drawable.getIntrinsicWidth(), 128);
            bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        }

        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bitmap;
    }

    @JavascriptInterface
    public boolean launchApp(String packageName) {
        try {
            Intent intent = activity.getPackageManager().getLaunchIntentForPackage(packageName);
            if (intent != null) {
                activity.startActivity(intent);
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public boolean hasMediaAccess() {
        String pkgName = activity.getPackageName();
        final String flat = Settings.Secure.getString(activity.getContentResolver(), "enabled_notification_listeners");
        if (!TextUtils.isEmpty(flat)) {
            final String[] names = flat.split(":");
            for (String name : names) {
                final ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && TextUtils.equals(pkgName, cn.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }

    @JavascriptInterface
    public void requestMediaAccess() {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity.startActivity(intent);
    }

    @JavascriptInterface
    public String getCurrentMedia() {
        try {
            if (mediaSessionManager != null) {
                List<MediaController> controllers = null;

                try {
                    ComponentName componentName = new ComponentName(activity, MediaNotificationListener.class);
                    controllers = mediaSessionManager.getActiveSessions(componentName);
                } catch (Exception e) {
                    controllers = mediaSessionManager.getActiveSessions(null);
                }

                if (controllers != null && !controllers.isEmpty()) {
                    MediaController activeController = null;
                    MediaController mostRecentController = null;
                    long latestTime = 0;

                    for (MediaController controller : controllers) {
                        PlaybackState playbackState = controller.getPlaybackState();
                        CharSequence titleForLog = null;
                        try { MediaMetadata md = controller.getMetadata(); if (md != null) titleForLog = md.getText(MediaMetadata.METADATA_KEY_TITLE); } catch (Exception ignored) {}
                        if (playbackState != null) {
                            int state = playbackState.getState();
                            if (state == PlaybackState.STATE_PLAYING || state == PlaybackState.STATE_BUFFERING) {
                                activeController = controller;
                                break;
                            }
                            long lastPositionUpdateTime = playbackState.getLastPositionUpdateTime();
                            if (lastPositionUpdateTime > latestTime) {
                                latestTime = lastPositionUpdateTime;
                                mostRecentController = controller;
                            }
                        }
                    }

                    if (activeController == null) {
                        activeController = (mostRecentController != null) ? mostRecentController : controllers.get(0);
                    }

                    if (activeController != null) {
                        MediaMetadata metadata = activeController.getMetadata();
                        PlaybackState playbackState = activeController.getPlaybackState();

                        if (metadata != null) {
                            JSONObject media = new JSONObject();

                            CharSequence title = metadata.getText(MediaMetadata.METADATA_KEY_TITLE);
                            CharSequence artist = metadata.getText(MediaMetadata.METADATA_KEY_ARTIST);
                            CharSequence album = metadata.getText(MediaMetadata.METADATA_KEY_ALBUM);

                            if (title != null) media.put("title", title.toString());
                            if (artist != null) media.put("artist", artist.toString());
                            if (album != null) media.put("album", album.toString());

                            CharSequence displayTitle = metadata.getText(MediaMetadata.METADATA_KEY_DISPLAY_TITLE);
                            CharSequence displaySubtitle = metadata.getText(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE);
                            CharSequence displayDescription = metadata.getText(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION);

                            if (displayTitle != null && !media.has("title")) media.put("title", displayTitle.toString());
                            if (displaySubtitle != null && !media.has("artist")) media.put("artist", displaySubtitle.toString());
                            if (displayDescription != null) media.put("description", displayDescription.toString());

                            long duration = 0;
                            try { duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION); } catch (Exception ignored) {}
                            if (duration > 0) media.put("duration", duration);

                            if (playbackState != null) {
                                long position = playbackState.getPosition();
                                if (position >= 0) media.put("position", position);

                                int state = playbackState.getState();
                                media.put("isPlaying", state == PlaybackState.STATE_PLAYING);
                                media.put("isPaused", state == PlaybackState.STATE_PAUSED);
                                media.put("isStopped", state == PlaybackState.STATE_STOPPED);

                                float speed = playbackState.getPlaybackSpeed();
                                if (speed != 0) media.put("speed", speed);
                            }

                            String packageName = activeController.getPackageName();
                            if (packageName != null) media.put("packageName", packageName);

                            String result = media.toString();
                            return result;
                        }
                    }
                }
            }

            String cached = MediaNotificationListener.getCachedMedia();
            return cached;
        } catch (Exception e) {
            return MediaNotificationListener.getCachedMedia();
        }
    }

    @JavascriptInterface
    public String getAppVersion() {
        try {
            PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            return pInfo.versionName != null ? pInfo.versionName : "";
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public void restartApp() {
        activity.runOnUiThread(() -> {
            Intent intent = activity.getPackageManager().getLaunchIntentForPackage(activity.getPackageName());
            if (intent != null) {
                Intent mainIntent = Intent.makeRestartActivityTask(intent.getComponent());
                activity.startActivity(mainIntent);
                Runtime.getRuntime().exit(0);
            }
        });
    }

    @JavascriptInterface
    public boolean isDefaultLauncher() {
        final Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_HOME);
        final ResolveInfo res = activity.getPackageManager().resolveActivity(intent, 0);
        if (res != null && res.activityInfo != null) {
            return res.activityInfo.packageName.equals(activity.getPackageName());
        }
        return false;
    }

    @JavascriptInterface
    public void openLauncherSettings() {
        Intent intent = new Intent(Settings.ACTION_HOME_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity.startActivity(intent);
    }

    @JavascriptInterface
    public boolean downloadAndInstallApk(String url) {
        try {
            if (downloadManager == null) return false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!activity.getPackageManager().canRequestPackageInstalls()) {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    intent.setData(Uri.parse("package:" + activity.getPackageName()));
                    activity.startActivity(intent);
                    return true;
                }
            }

            if (downloadReceiver != null) {
                try {
                    activity.unregisterReceiver(downloadReceiver);
                } catch (Exception ignored) {}
            }

            downloadReceiver = new DownloadCompleteReceiver(activity);
            IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
            ContextCompat.registerReceiver(activity, downloadReceiver, filter, ContextCompat.RECEIVER_EXPORTED);

            File oldFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "maxdrive-latest.apk");
            if (oldFile.exists()) {
                oldFile.delete();
            }

            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url))
                    .setTitle("MAXDrive Update")
                    .setDescription("Downloading latest APK")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "maxdrive-latest.apk")
                    .setAllowedOverMetered(true)
                    .setAllowedOverRoaming(true);
            
            currentDownloadId = downloadManager.enqueue(req);
            startProgressTracking();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void startProgressTracking() {
        new Thread(() -> {
            while (currentDownloadId != -1) {
                try {
                    DownloadManager.Query query = new DownloadManager.Query().setFilterById(currentDownloadId);
                    Cursor cursor = downloadManager.query(query);
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        int downloadedBytesIdx = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                        int totalBytesIdx = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                        int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        
                        if (downloadedBytesIdx != -1 && totalBytesIdx != -1) {
                            long downloadedBytes = cursor.getLong(downloadedBytesIdx);
                            long totalBytes = cursor.getLong(totalBytesIdx);
                            
                            if (totalBytes > 0) {
                                int progress = (int) ((downloadedBytes * 100) / totalBytes);
                                webView.post(() -> webView.evaluateJavascript(
                                    "if(window.onDownloadProgress) window.onDownloadProgress(" + progress + ");",
                                    null
                                ));
                            }
                        }
                        
                        if (statusIdx != -1) {
                            int status = cursor.getInt(statusIdx);
                            if (status == DownloadManager.STATUS_FAILED || status == DownloadManager.STATUS_SUCCESSFUL) {
                                currentDownloadId = -1;
                                cursor.close();
                                break;
                            }
                        }
                        cursor.close();
                    }
                    Thread.sleep(500);
                } catch (Exception e) {
                    break;
                }
            }
        }).start();
    }

    @JavascriptInterface
    public boolean isApkInstalled() {
        File apkFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "maxdrive-latest.apk");
        return !apkFile.exists();
    }

    @JavascriptInterface
    public boolean startObd(String target) {
        if (bluetoothAdapter == null) bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        try {
            BluetoothDevice targetDevice = null;
            if (bluetoothAdapter != null && bluetoothAdapter.isEnabled()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && 
                    ActivityCompat.checkSelfPermission(activity, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                    return false;
                }
                
                for (BluetoothDevice d : bluetoothAdapter.getBondedDevices()) {
                    if (d == null) continue;
                    String name = d.getName() != null ? d.getName() : "";
                    String addr = d.getAddress() != null ? d.getAddress() : "";
                    if ((target != null && !target.isEmpty() && (name.contains(target) || addr.equals(target))) || name.toLowerCase().contains("elm") || name.toLowerCase().contains("obd")) {
                        targetDevice = d;
                        break;
                    }
                }
            }
            if (targetDevice != null) {
                UUID uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
                obdSocket = targetDevice.createRfcommSocketToServiceRecord(uuid);
                obdSocket.connect();
                obdInputStream = obdSocket.getInputStream();
            } else {
                String[] candidates = new String[]{"/dev/ttyUSB0","/dev/ttyUSB1","/dev/ttyS0","/dev/ttyS1","/dev/ttyMT1","/dev/ttyMT2"};
                FileInputStream fis = null;
                for (String path : candidates) {
                    try {
                        File f = new File(path);
                        if (f.exists() && f.canRead()) {
                            fis = new FileInputStream(f);
                            break;
                        }
                    } catch (Exception ignored) {}
                }
                if (fis == null) return false;
                obdInputStream = fis;
            }
            obdRunning = true;
            obdThread = new Thread(() -> {
                try {
                    InputStream in = obdInputStream;
                    byte[] buffer = new byte[1024];
                    int read;
                    StringBuilder sb = new StringBuilder();
                    while (obdRunning && in != null && (read = in.read(buffer)) > 0) {
                        sb.append(new String(buffer, 0, read));
                        int idx;
                        while ((idx = sb.indexOf("\n")) != -1) {
                            String line = sb.substring(0, idx).trim();
                            sb.delete(0, idx + 1);
                            final String payload = line;
                            webView.post(() -> webView.evaluateJavascript("if(window.onOBDData) window.onOBDData(" + JSONObject.quote(payload) + ");", null));
                        }
                    }
                } catch (Exception ignored) {
                } finally {
                    try { if (obdInputStream != null) obdInputStream.close(); } catch (Exception ignored) {}
                    try { if (obdSocket != null) obdSocket.close(); } catch (Exception ignored) {}
                    obdRunning = false;
                }
            });
            obdThread.start();
            return true;
        } catch (SecurityException se) {
            return false;
        } catch (Exception e) {
            try { if (obdInputStream != null) obdInputStream.close(); } catch (Exception ignored) {}
            try { if (obdSocket != null) obdSocket.close(); } catch (Exception ignored) {}
            obdRunning = false;
            return false;
        }
    }

    @JavascriptInterface
    public void stopObd() {
        obdRunning = false;
        try { if (obdInputStream != null) obdInputStream.close(); } catch (Exception ignored) {}
        try { if (obdSocket != null) obdSocket.close(); } catch (Exception ignored) {}
        obdInputStream = null;
        obdSocket = null;
        if (obdThread != null) {
            try { obdThread.join(200); } catch (Exception ignored) {}
            obdThread = null;
        }
    }

    @JavascriptInterface
    public boolean isObdRunning() {
        return obdRunning;
    }
}

class DownloadCompleteReceiver extends BroadcastReceiver {
    private final BridgeActivity activity;

    DownloadCompleteReceiver(BridgeActivity activity) {
        this.activity = activity;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) return;
            long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            
            DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
            Cursor cursor = dm.query(query);
            
            if (cursor != null && cursor.moveToFirst()) {
                int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                if (statusIdx != -1) {
                    int status = cursor.getInt(statusIdx);
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        installApk();
                    }
                }
                cursor.close();
            }
            activity.unregisterReceiver(this);
        } catch (Exception ignored) {}
    }

    private void installApk() {
        try {
            File apkFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "maxdrive-latest.apk");
            if (apkFile.exists()) {
                Uri contentUri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", apkFile);
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                activity.startActivity(intent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView wv = getBridge().getWebView();
        wv.getSettings().setJavaScriptEnabled(true);
        wv.addJavascriptInterface(new WebAppInterface(this, wv), "Android");
    }
}
