import type { CapacitorConfig } from '@capacitor/cli';

/**
 * FARMAN Android shell.
 * The web build is fully local; the Android app never needs a network connection.
 */
const config: CapacitorConfig = {
  appId: 'com.khiyarusa.farman',
  appName: 'FARMAN',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#080a0b',
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
