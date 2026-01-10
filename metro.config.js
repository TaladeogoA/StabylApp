const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'ndjson' to the asset extensions
config.resolver.assetExts.push('ndjson');

module.exports = config;
