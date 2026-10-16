import { pickFile } from './pick-file'

export const pickSqliteFile = () =>
  pickFile({
    buttonLabel: 'Open',
    filters: [
      {
        extensions: ['db', 'db3', 'sqlite', 'sqlite3'],
        name: 'SQLite databases',
      },
      { extensions: ['*'], name: 'All files' },
    ],
    properties: ['openFile'],
  })
