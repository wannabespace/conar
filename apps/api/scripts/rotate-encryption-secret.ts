import { env } from '@tamery/db/env'

import { runColumnKeyRotation } from './column-key-rotation'

// ENCRYPTION_SECRET is the at-rest key for every encryptedText/encryptedJson column.
await runColumnKeyRotation({
  columns: [
    { column: 'connection_string', key: 'id', table: 'connections' },
    { column: 'query', key: 'id', table: 'queries' },
    { column: 'metadata', key: 'id', table: 'chats_messages' },
    { column: 'part', key: 'id', table: 'chats_messages_parts' },
    { column: 'view', key: 'id', table: 'shares' },
  ],
  oldSecret: env.ENCRYPTION_SECRET,
  secretName: 'ENCRYPTION_SECRET',
})
