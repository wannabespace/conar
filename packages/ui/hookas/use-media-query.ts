import * as React from 'react'

export function useMediaQuery(
  query: string,
  initialValue?: boolean,
) {
  const [matches, setMatches] = React.useState(initialValue ?? false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    setMatches(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}
