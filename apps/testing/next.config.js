const withTM = require("next-transpile-modules")([
  "ui",
  "romaine",
  "romaine-components",
]);
/** @type {import('next').NextConfig} */
module.exports = withTM({
  reactStrictMode: true,
  swcMinify: true,
});
