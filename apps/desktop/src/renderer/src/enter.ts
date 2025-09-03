import { sleep } from './lib/helpers'

let isEntered = false

export function enterAppAnimation() {
  if (isEntered)
    return

  isEntered = true

  const preloader = document.getElementById('preloader')
  const root = document.getElementById('root')!

  sleep(100).then(() => {
    root.classList.remove('scale-[1.2]', 'opacity-0')
    document.body.classList.remove('overflow-hidden')
  })

  if (preloader) {
    preloader.classList.add('scale-[0.6]', 'opacity-0', 'animate-spin')
    sleep(500).then(() => preloader.remove())
  }
}
