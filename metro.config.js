const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Docker nginx reaches Metro via service name web-dev:8081 (not 127.0.0.1).
config.server = { ...(config.server ?? {}), host: "0.0.0.0" };
config.watchFolders = [__dirname];

// Windows Docker bind mounts: native fs.watch fails; avoid Metro health-check + NativeWind race.
if (process.env.CHOKIDAR_USEPOLLING === "true" || process.env.METRO_DOCKER === "1") {
  config.watcher = {
    ...(config.watcher ?? {}),
    healthCheck: {
      enabled: false,
    },
  };
  config.maxWorkers = 2;
}

module.exports = withNativeWind(config, { input: "./global.css" });
