import { toastManager } from '../components/toast'

export function copy(text: string, successText?: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (successText) {
        toastManager.add({
          title: successText,
          type: 'success',
          timeout: 1500,
        })
      }
    })
}
