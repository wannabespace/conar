export function getOS() {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('win')) {
    return 'windows'
  }
  else if (userAgent.includes('mac')) {
    return 'macos'
  }
  else if (userAgent.includes('linux')) {
    return 'linux'
  }
  else if (userAgent.includes('android')) {
    return 'android'
  }
  else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'ios'
  }

  return 'unknown'
}
