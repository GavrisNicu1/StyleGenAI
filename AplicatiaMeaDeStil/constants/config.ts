import { Platform } from 'react-native';
import Constants from 'expo-constants';

type ExtraConfig = {
  apiBaseUrl?: string;
  apiBaseUrlWeb?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
const fallbackBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const isTunnelHost = (host: string) => {
  const normalized = host.toLowerCase();
  return (
    normalized.includes('exp.direct') ||
    normalized.includes('expo.dev') ||
    normalized.includes('ngrok') ||
    normalized.includes('localhost') ||
    normalized === '127.0.0.1'
  );
};

const getNativeApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return extra.apiBaseUrlWeb || fallbackBaseUrl;
  }

  const explicitNativeUrl = (extra.apiBaseUrl || '').trim();
  const autoMode = explicitNativeUrl.toLowerCase() === 'auto';

  if (explicitNativeUrl && !autoMode) {
    return explicitNativeUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return fallbackBaseUrl;
  }

  const host = hostUri.split(':')[0];
  if (!host || isTunnelHost(host)) {
    return fallbackBaseUrl;
  }

  return `http://${host}:5000`;
};

export const API_BASE_URL = getNativeApiBaseUrl();

const LOCAL_BACKEND_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2', '::1']);

const getApiOrigin = (baseUrl: string) => {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl.replace(/\/+$/, '');
  }
};

const remapLocalAbsoluteUrl = (url: string, targetOrigin: string) => {
  try {
    const parsed = new URL(url);
    if (!LOCAL_BACKEND_HOSTS.has(parsed.hostname.toLowerCase())) {
      return url;
    }
    return `${targetOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|\[::1\])(?::\d+)?/i,
      targetOrigin.replace(/\/+$/, '')
    );
  }
};

export const resolveBackendAssetUrl = (assetPath: string | null | undefined, baseUrl = API_BASE_URL): string => {
  if (!assetPath) {
    return '';
  }

  const path = assetPath.trim();
  if (!path) {
    return '';
  }

  if (/^(file|content|data):/i.test(path)) {
    return path;
  }

  const apiOrigin = getApiOrigin(baseUrl);

  if (/^https?:\/\//i.test(path)) {
    return remapLocalAbsoluteUrl(path, apiOrigin);
  }

  const normalizedPath = path.replace(/^\/+/, '');
  return `${apiOrigin}/${normalizedPath}`;
};

export function backendInfo(): string { 
  return `API Base URL: ${API_BASE_URL}`; 
}
