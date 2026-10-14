import {
  connectionDiagnosisInput,
  diagnoseConnection as diagnose,
} from '@tamery/ai/features'
import { AiFeature } from '@tamery/ai/usage'

import { aiUsage } from '~/lib/ai-usage'
import { authMiddleware, orpc } from '~/orpc'

export const diagnoseConnection = orpc
  .use(authMiddleware)
  .input(connectionDiagnosisInput)
  .handler(({ context, input, signal }) =>
    diagnose({
      input,
      signal,
      telemetry: aiUsage.telemetry({
        feature: AiFeature.DiagnoseConnection,
        userId: context.user.id,
      }),
    })
  )
