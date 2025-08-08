import type { LinkProps } from '@tanstack/react-router'
import type { ComponentProps, MouseEvent } from 'react'
import { useRouter } from '@tanstack/react-router'

export function MousedownLink({ children, to, params, search, ...props }: Omit<LinkProps, 'children'> & ComponentProps<'a'>) {
  const router = useRouter()
  const handleMouseDown = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    router.navigate({
      to,
      params,
      search,
    })
  }

  return (
    <a
      {...props}
      href={router.history.createHref(router.buildLocation({ to, params, search }).href)}
      onClick={e => e.preventDefault()}
      onMouseDown={handleMouseDown}
    >
      {children}
    </a>
  )
}
