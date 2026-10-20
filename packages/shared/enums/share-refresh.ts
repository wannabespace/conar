export enum ShareRefresh {
  Live = 'live',
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
}

export const shareRefreshLabels: Record<ShareRefresh, string> = {
  [ShareRefresh.Day]: 'Every day',
  [ShareRefresh.Hour]: 'Every hour',
  [ShareRefresh.Live]: 'Live',
  [ShareRefresh.Minute]: 'Every minute',
}
