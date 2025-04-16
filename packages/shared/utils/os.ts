export type OS = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown'

export function getOS(userAgent?: string): OS {
  const agent = (userAgent || navigator.userAgent).toLowerCase()

  if (agent.includes('win')) {
    return 'windows'
  }
  else if (agent.includes('mac')) {
    return 'macos'
  }
  else if (agent.includes('linux')) {
    return 'linux'
  }
  else if (agent.includes('android')) {
    return 'android'
  }
  else if (agent.includes('ios') || agent.includes('iphone') || agent.includes('ipad')) {
    return 'ios'
  }

  return 'unknown'
}
