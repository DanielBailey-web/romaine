/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["ui", "romaine", "romaine-components", "@romaine/bg-removal"],
  experimental: { nextScriptWorkers: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // onnxruntime-web is browser-only; exclude from server bundle
      config.externals = [...(config.externals || []), "onnxruntime-web", "onnxruntime-web/webgpu"];
    }
    // Enable WASM support for onnxruntime-web
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};
module.exports = nextConfig;
