export type UpdatesStatus =
  | 'no-updates'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'error'

export type UpdateChannel = 'stable' | 'beta'
