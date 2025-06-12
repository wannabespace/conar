import { toast } from 'sonner'

export function copy(text: string, successText = 'Text copied to clipboard') {
  navigator.clipboard.writeText(text)
    .then(() => {
      toast.success(successText)
    })
}
