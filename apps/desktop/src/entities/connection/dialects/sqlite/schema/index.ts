import type { InformationSchema } from '../information'

interface Main {
  [key: string]: Record<string, unknown>
}

export type Database = InformationSchema & { main: Main }
