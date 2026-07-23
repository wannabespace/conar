import type { LinkProps } from '@tanstack/react-router'
import type { ComponentProps } from 'react'

import { Link } from '~/components/link'

import { useConnectionResourceLinkParams } from '../hooks'

export function ConnectionResourceLink({
  resourceId,
  ...props
}: { resourceId: string; activateOn?: 'press' | 'click' } & Omit<
  LinkProps,
  'to' | 'params' | 'search'
> &
  ComponentProps<'a'>) {
  const params = useConnectionResourceLinkParams(resourceId)
  return <Link {...params} {...props} />
}
