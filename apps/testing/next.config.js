const withTM = require("next-transpile-modules")([
  "ui",
  "romaine",
  "romaine-components",
]);
/** @type {import('next').NextConfig} */
const opts = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: { nextScriptWorkers: true },
};
module.exports = withTM(opts);
