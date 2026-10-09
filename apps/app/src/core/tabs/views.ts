import { definitionsView } from '~/modules/definitions/view'
import { runnerView } from '~/modules/runner/view'
import { tableView } from '~/modules/table/view'
import { visualizerView } from '~/modules/visualizer/view'

import type { TabView } from './types'

export const tabViews: Record<string, TabView | undefined> = {
  definitions: definitionsView,
  runner: runnerView,
  table: tableView,
  visualizer: visualizerView,
}
