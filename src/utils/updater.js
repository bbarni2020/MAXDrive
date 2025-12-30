import axios from 'axios';
import androidBridge from './androidBridge';
const repoFromEnv = process.env.REACT_APP_GITHUB_REPO || '';
function parseVersion(v) {
  const cleaned = (v || '0.0.0').replace(/^v/, '').replace(/[a-zA-Z]+.*$/, '');
  return cleaned.split('.').map(n => parseInt(n, 10) || 0);
}
function isNewer(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return false;
}
async function fetchLatestRelease(repo) {
  if (!repo) return null;
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  try {
    const res = await axios.get(url, { headers: { Accept: 'application/vnd.github+json' } });
    const data = res.data || {};
    const tag = data.tag_name || data.name || '';
    const asset = (data.assets || []).find(a => /\.apk$/i.test(a.name));
    return asset ? { version: tag, apkUrl: asset.browser_download_url } : { version: tag, apkUrl: null };
  } catch (err) {
    return null;
  }
}
export async function checkForUpdate(repo = repoFromEnv) {
  if (!repo) return { available: false };
  const currentVersion = await androidBridge.getAppVersion();
  const latest = await fetchLatestRelease(repo);
  if (!latest || !latest.version) return { available: false };
  if (!currentVersion) {
    return { available: !!latest.apkUrl, latest: latest.version, apkUrl: latest.apkUrl };
  }
  const newer = isNewer(latest.version, currentVersion);
  return { available: newer && !!latest.apkUrl, latest: latest.version, current: currentVersion, apkUrl: latest.apkUrl };
}
export async function performUpdate(apkUrl) {
  if (!apkUrl) return false;
  return androidBridge.downloadAndInstallApk(apkUrl);
}
