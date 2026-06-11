import { queries } from '@conar/db/schema'
import { eq } from 'drizzle-orm'
import { createShape } from '~/lib/electric'

export const queriesShape = createShape(async (c) => {
  return {
    where: eq(queries.userId, c.get('userId')),
    table: 'queries' satisfies typeof queries._.name,
    columns: [
      queries.id,
      queries.connectionResourceId,
      queries.name,
      queries.query,
      queries.createdAt,
      queries.updatedAt,
    ],
  }
})
