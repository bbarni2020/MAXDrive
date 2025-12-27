package com.maxdrive.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
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
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

class WebAppInterface {
    private BridgeActivity activity;
    private WebView webView;
    private DownloadManager downloadManager;
    private long currentDownloadId = -1;
    private DownloadCompleteReceiver downloadReceiver;

    WebAppInterface(BridgeActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.downloadManager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
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
            
            // Skip if we've already added this app (handles apps with multiple launcher activities)
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
            } catch (JSONException e) {
                // Ignore errors for individual apps
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
        if (drawable instanceof BitmapDrawable) {
            BitmapDrawable bitmapDrawable = (BitmapDrawable) drawable;
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
            if (downloadManager == null) {
                return false;
            }

            if (downloadReceiver != null) {
                try {
                    activity.unregisterReceiver(downloadReceiver);
                } catch (Exception e) {}
            }

            downloadReceiver = new DownloadCompleteReceiver(activity, webView);
            IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                activity.registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                activity.registerReceiver(downloadReceiver, filter);
            }

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
                                webView.post(() -> {
                                    webView.evaluateJavascript(
                                        "if(window.onDownloadProgress) window.onDownloadProgress(" + progress + ");",
                                        null
                                    );
                                });
                            }
                        }
                        
                        if (statusIdx != -1) {
                            int status = cursor.getInt(statusIdx);
                            if (status == DownloadManager.STATUS_FAILED || status == DownloadManager.STATUS_SUCCESSFUL) {
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
}

class DownloadCompleteReceiver extends BroadcastReceiver {
    private BridgeActivity activity;
    private WebView webView;

    DownloadCompleteReceiver(BridgeActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            
            DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
            Cursor cursor = dm.query(query);
            
            if (cursor != null && cursor.moveToFirst()) {
                int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                if (statusIdx != -1) {
                    int status = cursor.getInt(statusIdx);
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        int uriIdx = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
                        if (uriIdx != -1) {
                            String uriString = cursor.getString(uriIdx);
                            installApk(Uri.parse(uriString));
                        }
                    }
                }
                cursor.close();
            }
            
            activity.unregisterReceiver(this);
        } catch (Exception e) {
        }
    }

    private void installApk(Uri apkUri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            
            Uri contentUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                if ("file".equals(apkUri.getScheme())) {
                    File apkFile = new File(apkUri.getPath());
                    contentUri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", apkFile);
                } else {
                    contentUri = apkUri;
                }
            } else {
                contentUri = apkUri;
            }
            
            intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            activity.startActivity(intent);
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
