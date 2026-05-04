import { PGlite } from '@electric-sql/pglite'
import { worker } from '@electric-sql/pglite/worker'

worker({
  async init() {
    return new PGlite('idb://conar')
  },
})
