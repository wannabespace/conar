import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from 'takumi-js/response'

export const Route = createFileRoute('/og-image.png')({
  server: {
    handlers: {
      async GET() {
        return new ImageResponse(
          (
            <div
              tw="flex h-full w-full flex-col justify-between bg-[#0a0a0a] p-20"
              style={{ fontFamily: 'Inter' }}
            >
              <div tw="flex items-center">
                <div tw="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#006EFF]">
                  <AppLogo style={{ width: 45, height: 45, color: '#ffffff' }} />
                </div>
                <span tw="ml-5 text-4xl font-semibold text-white">Conar</span>
              </div>
              <div tw="flex flex-col">
                <h1 tw="text-7xl font-bold leading-none text-white" style={{ margin: 0 }}>
                  AI database client
                </h1>
                <p tw="text-4xl text-[#a1a1aa]" style={{ marginTop: 16 }}>
                  Postgres · MySQL · MSSQL · ClickHouse
                </p>
              </div>
              <div tw="flex items-center justify-between">
                <span tw="text-3xl text-[#71717a]">conar.app</span>
                <span tw="text-3xl text-[#71717a]">Open source · macOS · Windows · Linux</span>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, immutable, no-transform, max-age=86400',
            },
          },
        )
      },
    },
  },
})
