import { Button as ReactEmailButton } from '@react-email/components'

export function Button(props: Omit<React.ComponentProps<typeof ReactEmailButton>, 'className'>) {
  return (
    <ReactEmailButton
      className="bg-primary text-white px-4 py-2 rounded-md"
      {...props}
    />
  )
}
