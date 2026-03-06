'use client'

import * as React from 'react'

export const useIsomorphicEffect
  = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect
