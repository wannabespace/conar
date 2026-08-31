import { sleep } from '@tamery/shared/utils/helpers'
import { createHooks } from 'hookable'

let isEntered = false

export const globalHooks = createHooks<{
  animationFinished: () => void
  refreshPressed: () => void
  savePressed: () => void
}>()

export const enterAppAnimation = () => {
  if (isEntered) {
    return
  }

  isEntered = true

  const preloader = document.querySelector('#preloader')
  const root = document.querySelector('#root')
  if (!root) {
    return
  }

  void (async () => {
    await sleep(50)
    root.classList.remove('scale-[1.05]', 'opacity-0')
    document.body.classList.remove('overflow-hidden')
    await sleep(75)
    await globalHooks.callHook('animationFinished')
  })()

  if (preloader) {
    preloader.classList.add('scale-[0.8]', 'opacity-0', 'animate-spin')
    void (async () => {
      await sleep(250)
      preloader.remove()
    })()
  }
}
