import { Button as ReactEmailButton } from '@react-email/components'

export function Button(props: Omit<React.ComponentProps<typeof ReactEmailButton>, 'className'>) {
  return (
    <ReactEmailButton
      className="rounded-md bg-primary px-4 py-2 text-white"
      {...props}
    />
  )
}
