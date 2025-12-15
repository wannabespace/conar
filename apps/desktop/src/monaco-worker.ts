import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { LanguageIdEnum } from 'monaco-sql-languages'
import MySQLWorker from 'monaco-sql-languages/esm/languages/mysql/mysql.worker?worker'
import PGSQLWorker from 'monaco-sql-languages/esm/languages/pgsql/pgsql.worker?worker'
import 'monaco-sql-languages/esm/languages/mysql/mysql.contribution'
import 'monaco-sql-languages/esm/languages/pgsql/pgsql.contribution'

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
    if (label === LanguageIdEnum.PG) {
      return new PGSQLWorker()
    }
    if (label === LanguageIdEnum.MYSQL) {
      return new MySQLWorker()
    }
    return new EditorWorker()
  },
}

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
