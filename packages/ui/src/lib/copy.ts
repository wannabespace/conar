import { toast } from 'sonner'

export const copy = async (text: string, successText?: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    toast.error('Could not copy to clipboard')
    return
  }
  if (successText) {
    toast.success(successText, {
      duration: 1500,
    })
  }
}
