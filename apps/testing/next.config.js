const withTM = require("next-transpile-modules")([
  "ui",
  "romaine",
  "romaine-components",
]);

module.exports = withTM({
  reactStrictMode: true,
});
