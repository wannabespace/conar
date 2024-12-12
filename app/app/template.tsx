import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './auth-provider'
import { QueryProvider } from './query-provider'

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryProvider>
  )
}
