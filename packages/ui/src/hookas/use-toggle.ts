import * as React from 'react'

export function useToggle(initialValue = false) {
  const [value, setValue] = React.useState(initialValue)

  const toggle = React.useCallback((value?: boolean) => {
    setValue(prev => value ?? !prev)
  }, [])

  return [value, toggle] as const
}
