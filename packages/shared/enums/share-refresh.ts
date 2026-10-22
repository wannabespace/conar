export enum ShareRefresh {
  Live = 'live',
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
}

// Live still waits a few seconds, so a busy link cannot hammer the owner's database.
export const SHARE_REFRESH_MS: Record<ShareRefresh, number> = {
  [ShareRefresh.Day]: 24 * 60 * 60 * 1000,
  [ShareRefresh.Hour]: 60 * 60 * 1000,
  [ShareRefresh.Live]: 5000,
  [ShareRefresh.Minute]: 60 * 1000,
}

export const shareRefreshLabels: Record<ShareRefresh, string> = {
  [ShareRefresh.Day]: 'Every day',
  [ShareRefresh.Hour]: 'Every hour',
  [ShareRefresh.Live]: 'Live',
  [ShareRefresh.Minute]: 'Every minute',
}
