export const openNewWindow = (href: string) => {
  if (window.electron) {
    void window.electron.app.openWindow(href)
    return
  }

  window.open(href, '_blank')
}
