export enum SyncType {
  Cloud = 'cloud',
  CloudWithoutPassword = 'cloud_without_password',
  // Local = 'local',
}

export const syncTypeLabels: Record<SyncType, string> = {
  [SyncType.Cloud]: 'Cloud (with password)',
  [SyncType.CloudWithoutPassword]: 'Cloud (without password)',
  // [SyncType.Local]: 'Local (no sync)',
}

export const syncTypeDescriptions: Record<SyncType, string> = {
  [SyncType.Cloud]: 'Sync your connection string across all devices with password encryption',
  [SyncType.CloudWithoutPassword]: 'Sync your connection string across devices without storing the password',
  // [SyncType.Local]: 'Keep your connection string only on this device',
}
