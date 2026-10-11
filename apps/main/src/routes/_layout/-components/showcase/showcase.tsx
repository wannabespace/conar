// Copies apps/app's connection workspace chrome (title bar, navigator, tab bar, table toolbar, grid, chat); keep in sync when it changes.

import { ChatPanel } from './chat-panel'
import { Grid } from './grid'
import { Navigator } from './navigator'
import { TabBar } from './tab-bar'
import { TitleBar } from './title-bar'
import { Toolbar } from './toolbar'

export const Showcase = () => (
  <figure className="w-full min-w-5xl">
    <figcaption className="sr-only">
      Tamery showing an orders table filtered through a foreign key, with
      selected rows, an unsaved edit and the AI chat answering questions about
      the data.
    </figcaption>
    <div
      inert
      className="bg-body ring-foreground/4 flex h-150 flex-col overflow-hidden rounded-2xl mask-b-from-90% shadow-2xl ring select-none sm:h-164"
    >
      <TitleBar />
      <div className="flex min-h-0 flex-1 p-2">
        <Navigator />
        <div className="bg-background ring-foreground/4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl ring">
          <TabBar />
          <Toolbar />
          <Grid />
        </div>
        <ChatPanel />
      </div>
    </div>
  </figure>
)
