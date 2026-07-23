import { sleep } from '@tamery/shared/utils/helpers'
import { createHooks } from 'hookable'

let isEntered = false

export const globalHooks = createHooks<{
  animationFinished: () => void
  refreshPressed: () => void
  savePressed: () => void
}>()

export function enterAppAnimation() {
  if (isEntered) return

  isEntered = true

  const preloader = document.getElementById('preloader')
  const root = document.getElementById('root')!

  sleep(50).then(() => {
    root.classList.remove('scale-[1.05]', 'opacity-0')
    document.body.classList.remove('overflow-hidden')
    // 150 - transition duration
    return sleep(150).then(() => globalHooks.callHook('animationFinished'))
  })

  if (preloader) {
    preloader.classList.add('scale-[0.8]', 'opacity-0', 'animate-spin')
    sleep(250).then(() => preloader.remove())
  }
}
