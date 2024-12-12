import { ThemeProvider } from 'next-themes'
import { env } from '~/env'
import './index.css'

const fontFamily = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily }} className="antialiased">
        {env.NEXT_PUBLIC_IS_DESKTOP && (
          <div
            data-tauri-drag-region
            className="fixed inset-x-0 top-0 h-7 w-full"
          />
        )}
        <ThemeProvider attribute="class">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
