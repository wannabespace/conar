import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { LanguageIdEnum } from 'monaco-sql-languages'
import FlinkSQLWorker from 'monaco-sql-languages/esm/languages/flink/flink.worker?worker'
import HiveSQLWorker from 'monaco-sql-languages/esm/languages/hive/hive.worker?worker'
import ImpalaSQLWorker from 'monaco-sql-languages/esm/languages/impala/impala.worker?worker'
import MySQLWorker from 'monaco-sql-languages/esm/languages/mysql/mysql.worker?worker'
import PGSQLWorker from 'monaco-sql-languages/esm/languages/pgsql/pgsql.worker?worker'
import SparkSQLWorker from 'monaco-sql-languages/esm/languages/spark/spark.worker?worker'
import TrinoSQLWorker from 'monaco-sql-languages/esm/languages/trino/trino.worker?worker'
import 'monaco-sql-languages/esm/languages/mysql/mysql.contribution'
import 'monaco-sql-languages/esm/languages/flink/flink.contribution'
import 'monaco-sql-languages/esm/languages/spark/spark.contribution'
import 'monaco-sql-languages/esm/languages/hive/hive.contribution'
import 'monaco-sql-languages/esm/languages/trino/trino.contribution'
import 'monaco-sql-languages/esm/languages/pgsql/pgsql.contribution'
import 'monaco-sql-languages/esm/languages/impala/impala.contribution'

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
    if (label === LanguageIdEnum.FLINK) {
      return new FlinkSQLWorker()
    }
    if (label === LanguageIdEnum.HIVE) {
      return new HiveSQLWorker()
    }
    if (label === LanguageIdEnum.SPARK) {
      return new SparkSQLWorker()
    }
    if (label === LanguageIdEnum.PG) {
      return new PGSQLWorker()
    }
    if (label === LanguageIdEnum.MYSQL) {
      return new MySQLWorker()
    }
    if (label === LanguageIdEnum.TRINO) {
      return new TrinoSQLWorker()
    }
    if (label === LanguageIdEnum.IMPALA) {
      return new ImpalaSQLWorker()
    }
    return new EditorWorker()
  },
}

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
