import { Button as ReactEmailButton } from '@react-email/components'

export const Button = (
  props: Omit<React.ComponentProps<typeof ReactEmailButton>, 'className'>
) => (
  <ReactEmailButton
    className="bg-primary rounded-md px-4 py-2 text-white"
    {...props}
  />
)
