export const notifications = {
  // Desktop only, and shown only while no app window is focused: never the sole place a user learns something.
  notify: (notification: { body: string; title: string }) => {
    void window.electron?.notifications.notify(notification)
  },
}
