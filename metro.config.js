const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.maxWorkers = 1;

module.exports = config;
