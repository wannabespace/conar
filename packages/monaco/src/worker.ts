// oxlint-disable-next-line import/default -- Vite ?worker virtual modules
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
// oxlint-disable-next-line import/default -- Vite ?worker virtual modules
import JsonWorker from 'monaco-editor/languages/features/json/json.worker?worker'

globalThis.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') {
      return new JsonWorker()
    }
    return new EditorWorker()
  },
}
