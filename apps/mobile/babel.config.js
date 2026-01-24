module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui"],
          config: "./tamagui.config.ts",
          // Exclude Daily SDK from Tamagui transformations
          exclude: [/node_modules\/@daily-co/],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
