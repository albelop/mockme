export default {
  output: "src/cli/test/.storybook/sw.js",
  plugins: [
    function (config = { input: ["a.js"] }) {
      return {
        parse: {
          order: "pre",
          handler: () => {
            console.log(config);
          },
        },
      };
    },
  ],
};
