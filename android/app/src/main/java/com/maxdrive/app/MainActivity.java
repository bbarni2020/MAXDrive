package com.maxdrive.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

class WebAppInterface {
    private BridgeActivity activity;
    private WebView webView;

    WebAppInterface(BridgeActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public String getInstalledApps() {
        PackageManager pm = activity.getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        JSONArray jsonArray = new JSONArray();
        for (ApplicationInfo appInfo : apps) {
            if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
                try {
                    JSONObject obj = new JSONObject();
                    obj.put("name", pm.getApplicationLabel(appInfo).toString());
                    obj.put("packageName", appInfo.packageName);
                    obj.put("icon", "📱");
                    obj.put("category", "App");
                    jsonArray.put(obj);
                } catch (JSONException e) {
                    // Ignore
                }
            }
        }
        return jsonArray.toString();
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
    public boolean downloadAndInstallApk(String url) {
        try {
            DownloadManager dm = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) return false;
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url))
                    .setTitle("MAXDrive Update")
                    .setDescription("Downloading latest APK")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "maxdrive-latest.apk")
                    .setAllowedOverMetered(true);
            dm.enqueue(req);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView wv = bridge.getWebView();
        wv.getSettings().setJavaScriptEnabled(true);
        wv.addJavascriptInterface(new WebAppInterface(this, wv), "Android");
    }
}
