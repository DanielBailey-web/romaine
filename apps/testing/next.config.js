/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["ui", "romaine", "romaine-components"],
  experimental: { nextScriptWorkers: true },
};
module.exports = nextConfig;
