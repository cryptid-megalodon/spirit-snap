// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  blacklistRE: /.*\.test\.(js|ts|tsx|jsx)$/,
};

module.exports = config;
