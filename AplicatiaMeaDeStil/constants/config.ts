import { Platform } from 'react-native';
import Constants from 'expo-constants';

type ExtraConfig = {
  apiBaseUrl?: string;
  apiBaseUrlWeb?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
const fallbackBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const apiBaseUrlFromConfig = Platform.OS === 'web' ? extra.apiBaseUrlWeb : extra.apiBaseUrl;

export const API_BASE_URL = apiBaseUrlFromConfig || fallbackBaseUrl;

export function backendInfo(): string { 
  return `API Base URL: ${API_BASE_URL}`; 
}
