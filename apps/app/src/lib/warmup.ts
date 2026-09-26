import('./database')

const MONACO_WARMUP_DELAY = 1000

window.addEventListener(
  'load',
  () => {
    setTimeout(() => import('@tamery/monaco/editor'), MONACO_WARMUP_DELAY)
  },
  { once: true }
)
