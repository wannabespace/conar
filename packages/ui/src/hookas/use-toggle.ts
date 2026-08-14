import * as React from 'react'

export const useToggle = (initialValue = false) => {
  const [value, setValue] = React.useState(initialValue)

  const toggle = React.useCallback((nextValue?: boolean) => {
    setValue((prev) => nextValue ?? !prev)
  }, [])

  return [value, toggle] as const
}
