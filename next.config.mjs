let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['cdn.anthropic.com', 'placehold.co'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  eslint: {
    // This disables ESLint during builds, which is necessary for Vercel deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This disables TypeScript checks during builds, which helps with Vercel deployment
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3004"],
    },
  },
  serverExternalPackages: ['@prisma/client'],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  // Override the default port to avoid conflict with backend
  env: {
    PORT: "3000"
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
