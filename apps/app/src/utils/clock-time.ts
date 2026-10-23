const clockTime = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  second: '2-digit',
})

export const formatClockTime = (date: Date) => clockTime.format(date)
