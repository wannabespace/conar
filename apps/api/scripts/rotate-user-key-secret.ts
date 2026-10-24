import { env } from '@tamery/db/env'

import { runColumnKeyRotation } from './column-key-rotation'

// USER_KEY_SECRET wraps every per-user connection key in user_encryption_keys.
await runColumnKeyRotation({
  columns: [
    { column: 'secret', key: 'user_id', table: 'user_encryption_keys' },
  ],
  oldSecret: env.USER_KEY_SECRET,
  secretName: 'USER_KEY_SECRET',
})
