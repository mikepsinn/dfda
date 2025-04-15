/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    typedRoutes: true,
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === "nodejs") {
      config.externals.push("graphile-worker");
    }
    return config;
  },
}

export default nextConfig
