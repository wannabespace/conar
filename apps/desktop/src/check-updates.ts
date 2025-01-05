import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { toast } from 'sonner'

export async function checkUpdates() {
  const update = await check()
  if (update) {
    toast.info(
      `found update ${update.version} from ${update.date} with notes ${update.body}`,
    )
    let downloaded = 0
    let contentLength = 0
    // alternatively we could also call update.download() and update.install() separately
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength || 0
          toast.info(`started downloading ${event.data.contentLength} bytes`)
          break
        case 'Progress':
          downloaded += event.data.chunkLength
          toast.info(`downloaded ${downloaded} from ${contentLength}`)
          break
        case 'Finished':
          toast.info('download finished')
          break
      }
    })

    toast.info('update installed')
    await relaunch()
  }
}
