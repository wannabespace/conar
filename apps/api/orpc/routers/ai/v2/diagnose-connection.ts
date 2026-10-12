import {
  connectionDiagnosisInput,
  diagnoseConnection as diagnose,
} from '@tamery/ai/features'
import { AiFeature } from '@tamery/ai/usage'

import { aiUsage } from '~/lib/ai-usage'
import { usage } from '~/lib/usage'
import { orpc, permissionsMiddleware, permix } from '~/orpc'

export const diagnoseConnection = orpc
  .use(permissionsMiddleware)
  .use(permix.checkMiddleware('ai.connection.use'))
  .input(connectionDiagnosisInput)
  .errors({
    FORBIDDEN: {
      message:
        "You've used this week's free AI connection help. Subscribe to Pro for unlimited help.",
    },
  })
  .handler(async ({ context, errors, input, signal }) => {
    const quota = await usage.get(context, 'connection')
    if (quota && quota.used >= quota.max) {
      throw errors.FORBIDDEN()
    }

    const diagnosis = await diagnose({
      input,
      signal,
      telemetry: aiUsage.telemetry({
        feature: AiFeature.DiagnoseConnection,
        userId: context.user.id,
      }),
    })
    await usage.record(context, 'connection')
    return diagnosis
  })
