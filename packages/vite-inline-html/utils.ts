export const PLUGIN_NAME = 'tamery:inline-html'

export const replaceMarkers = (
  html: string,
  replacements: (readonly [string, string])[]
) => {
  let result = html

  for (const [marker, markup] of replacements) {
    result = result.replace(marker, () => markup)
  }

  return result
}
