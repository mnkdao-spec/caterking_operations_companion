// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
const bundleId = "space.manus.caterking_operations_companion.t20260105004816";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "CaterKing",
  appSlug: "caterking_operations_companion",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl: "https://private-us-east-1.manuscdn.com/sessionFile/D7DXXccr3rTHubRbO1tU05/sandbox/vkh3NtxUwjXWxByg7cqOyk-img-1_1770071568000_na1fn_aWNvbg.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  owner: "caterking",
  privacy: "unlisted",
  sdkVersion: "54.0.0",
  version: "1.0.0",
  description: "Professional catering business operations management platform",
  primaryColor: "#1e3a8a",
  platforms: ["ios", "android", "web"],
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  runtimeVersion: "1.0.0",
  notification: {
    icon: "./assets/images/icon.png",
    color: "#1e3a8a",
  },
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#1e3a8a",
  },
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  backgroundColor: "#ffffff",
  newArchEnabled: true,
  assetBundlePatterns: ["**/*"],
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/caterking",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    backgroundColor: "#1e3a8a",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#1e3a8a",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png",
    backgroundColor: "#ffffff",
    scope: "/caterking",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 300,
        resizeMode: "contain",
        backgroundColor: "#1e3a8a",
        dark: {
          backgroundColor: "#1e3a8a",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "caterking-operations",
    },
  },
};

export default config;
