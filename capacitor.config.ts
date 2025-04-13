
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cbf656c4ad394d71b9d3aba0055c3d2f',
  appName: 'dia-companion-friend',
  webDir: 'dist',
  server: {
    url: 'https://cbf656c4-ad39-4d71-b9d3-aba0055c3d2f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#6200EE",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#FFFFFF",
    },
  }
};

export default config;
