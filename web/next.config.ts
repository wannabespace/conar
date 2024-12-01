import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'img.clerk.com',
      port: '',
    }],
  },
}

export default nextConfig
