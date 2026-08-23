const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/mysql-database'],
  // The site is just a blank page, when I enable this
  // experimental: {
  //   instrumentationHook: true,
  // },
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'wishonia-blob.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'pcpfoetqkuq7jmso.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'cdn.openai.com',
        port: '',
      },
    ],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
  },
  async headers() {
    return [
      {
        source: '/img/Logo-Crowdsourcing-Cures-256-70.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  output: 'standalone',
  // Enable build cache
  distDir: '.next',
  generateBuildId: async () => {
    // In CI, use a deterministic build ID based on the commit hash
    if (process.env.GITHUB_SHA) {
      return process.env.GITHUB_SHA
    }
    // In development, use a timestamp
    return `dev-${Date.now()}`
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // CI runs `pnpm type-check` immediately before the build. Skipping Next's
    // duplicate checker there avoids retaining the compiler graph inside the
    // memory-heavy production build worker.
    ignoreBuildErrors: process.env.NEXT_SKIP_BUILD_TYPECHECK === 'true',
  },
}

module.exports = withBundleAnalyzer(nextConfig)
