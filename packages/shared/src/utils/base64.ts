export function getBase64FromFiles(files: File[]): Promise<string[]> {
  return Promise.all(files.map(getBase64))
}

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = event => resolve(event.target?.result as string)
    reader.onerror = error => reject(error)

    reader.readAsDataURL(file)
  })
}
