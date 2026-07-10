import { toast } from 'sonner'

export function copy(text: string, successText?: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (successText) {
        toast.success(successText, {
          duration: 1500,
        })
      }
    })
}
