import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  async headers() {
    const origin = process.env.NODE_ENV === 'production' ? 'tauri://localhost' : 'http://localhost:3100'

    return [
      {
        source: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'origin',
            value: origin,
          },
        ],
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: origin,
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, trpc-accept',
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Set-Auth-Token',
          },
        ],
      },
    ]
  },
}

export default nextConfig
