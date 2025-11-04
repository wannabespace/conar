export function getErrorMessage(error: unknown) {
  return String(error instanceof Error ? error.cause || error.message : error).replace('Error: ', '') || 'Unknown error'
}
