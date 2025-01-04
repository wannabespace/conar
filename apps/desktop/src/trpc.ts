import type { AppRouter } from '@connnect/web/trpc-type'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()
