// oxlint-disable-next-line import/default -- Vite ?worker virtual modules
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
// oxlint-disable-next-line import/default -- Vite ?worker virtual modules
import CssWorker from 'monaco-editor/languages/features/css/css.worker?worker'
// oxlint-disable-next-line import/default -- Vite ?worker virtual modules
import HtmlWorker from 'monaco-editor/languages/features/html/html.worker?worker'
// oxlint-disable-next-line import/default -- Vite ?worker virtual modules
import JsonWorker from 'monaco-editor/languages/features/json/json.worker?worker'
// oxlint-disable-next-line import/default -- Vite ?worker virtual modules
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker'

globalThis.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') {
      return new JsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker()
    }
    return new EditorWorker()
  },
}
