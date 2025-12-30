package com.maxdrive.app;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.media.MediaMetadata;
import android.content.ComponentName;
import java.util.List;

public class MediaNotificationListener extends NotificationListenerService {
    private static final String TAG = "MediaListener";
    private static String cachedMediaJson = "{}";
    private static long lastUpdateTime = 0;

    @Override
    public void onListenerConnected() {
        updateCurrentMedia();
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        if (isMediaApp(packageName)) {
            updateCurrentMedia();
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        if (isMediaApp(packageName)) {
            updateCurrentMedia();
        }
    }

    private boolean isMediaApp(String packageName) {
        return packageName != null && (
            packageName.contains("music") ||
            packageName.contains("spotify") ||
            packageName.contains("youtube") ||
            packageName.contains("soundcloud") ||
            packageName.contains("pandora") ||
            packageName.contains("deezer") ||
            packageName.contains("tidal") ||
            packageName.contains("apple.music") ||
            packageName.contains("com.google.android.music") ||
            packageName.contains("com.android.music")
        );
    }

    private void updateCurrentMedia() {
        try {
            MediaSessionManager mediaSessionManager = (MediaSessionManager) getSystemService(MEDIA_SESSION_SERVICE);
            if (mediaSessionManager != null) {
                List<MediaController> controllers;
                try {
                    ComponentName componentName = new ComponentName(this, MediaNotificationListener.class);
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
                            org.json.JSONObject media = new org.json.JSONObject();

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

                            long duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION);
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

                            cachedMediaJson = media.toString();
                            lastUpdateTime = System.currentTimeMillis();
                        }
                    }
                }
            }
        } catch (Exception e) {
        }
    }

    public static void setCachedMedia(String json) {
        cachedMediaJson = json;
        lastUpdateTime = System.currentTimeMillis();
    }

    public static String getCachedMedia() {
        if (System.currentTimeMillis() - lastUpdateTime < 30000) {
            return cachedMediaJson;
        }
        return "{}";
    }
}
