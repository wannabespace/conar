export function useCopy(success: () => void) {
  function copy(text: string) {
    navigator.clipboard.writeText(text)
    success()
  }

  return { copy }
}
