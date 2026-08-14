import { toast } from 'sonner'

export const copy = async (text: string, successText?: string) => {
  await navigator.clipboard.writeText(text)
  if (successText) {
    toast.success(successText, {
      duration: 1500,
    })
  }
}
