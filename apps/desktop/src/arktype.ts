import { configure } from 'arktype/config'

const _config = configure({
  onFail: errors => errors.throw(),
})

declare global {
  interface ArkEnv {
    onFail: typeof _config.onFail
  }
}
