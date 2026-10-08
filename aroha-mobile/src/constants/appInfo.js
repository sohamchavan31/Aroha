import Constants from 'expo-constants';
import { Platform } from 'react-native';

const config = Constants.expoConfig ?? {};

const version = config.version ?? '1.0.0';
const buildNumber = Platform.OS === 'ios'
  ? config.ios?.buildNumber ?? '1'
  : String(config.android?.versionCode ?? 1);

export const WEBSITE = 'https://aroha.sohrexlabs.com';
export const SUPPORT_EMAIL = 'support@sohrexlabs.com';

export default {
  version,
  buildNumber,
  displayVersion: `v${version} (${buildNumber})`,
};
