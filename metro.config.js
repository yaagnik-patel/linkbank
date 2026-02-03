// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add platform extension resolution
config.resolver.platformExtensions = ['native.js', 'js', 'json', 'ts', 'tsx', 'web.js'];

// Handle module resolution for aliases
config.resolver.alias = {
  '@': '.',
};

module.exports = config;
