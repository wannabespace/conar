import { registerGlobalMiddleware } from '@tanstack/react-start'
import { logMiddleware } from './utils/logging-middleware'

registerGlobalMiddleware({
  middleware: [logMiddleware],
})
