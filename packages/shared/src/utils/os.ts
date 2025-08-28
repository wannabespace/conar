export type OS = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown'

export const osMap: Record<OS, { type: OS, label: string }> = {
  windows: {
    type: 'windows',
    label: 'Windows',
  },
  macos: {
    type: 'macos',
    label: 'macOS',
  },
  linux: {
    type: 'linux',
    label: 'Linux',
  },
  android: {
    type: 'android',
    label: 'Android',
  },
  ios: {
    type: 'ios',
    label: 'iOS',
  },
  unknown: {
    type: 'unknown',
    label: 'Unknown',
  },
}

export function getOS(userAgent: string): { type: OS, label: string } {
  const agent = userAgent.toLowerCase()

  if (agent.includes('win')) {
    return osMap.windows
  }
  else if (agent.includes('mac')) {
    return osMap.macos
  }
  else if (agent.includes('linux')) {
    return osMap.linux
  }
  else if (agent.includes('android')) {
    return osMap.android
  }
  else if (agent.includes('ios') || agent.includes('iphone') || agent.includes('ipad')) {
    return osMap.ios
  }

  return osMap.unknown
}

export function isCtrlEnter(event: KeyboardEvent) {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey)
}
