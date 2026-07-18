require("dotenv").config();

module.exports = {
  expo: {
    name: "Ethio Fiction",
    slug: "ethio-fiction",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#120D0A",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.ethiofiction.app",
    },
    android: {
      package: "com.ethiofiction.app",
      adaptiveIcon: {
        backgroundColor: "#120D0A",
      },
    },
    web: {
      bundler: "metro",
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};
