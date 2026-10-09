interface AppNotification {
  body: string
  title: string
}

const notifyInBrowser = async ({ body, title }: AppNotification) => {
  if (document.hasFocus() || !('Notification' in window)) {
    return
  }
  // Safari only shows the permission prompt from a user gesture, so there the first notification asks nothing and is dropped.
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
  if (Notification.permission !== 'granted') {
    return
  }
  const notification = new Notification(title, { body })
  notification.addEventListener('click', () => {
    window.focus()
    notification.close()
  })
}

export const notifications = {
  // Shown only while the app is not focused: never the sole place a user learns something.
  notify: (notification: AppNotification) => {
    if (window.electron) {
      void window.electron.notifications.notify(notification)
      return
    }
    void notifyInBrowser(notification)
  },
}
