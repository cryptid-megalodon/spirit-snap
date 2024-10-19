module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null, // or 'blacklist' if using older versions
          whitelist: null, // or 'whitelist' if using older versions
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
