import { Store } from '@tanstack/react-store'
import { type } from 'arktype'

const LAYOUT_STORE_VERSION = 1

export const layoutPresetType = type({
  id: 'string',
  name: 'string',
  isBuiltIn: 'boolean',
  sidebarVisible: 'boolean',
  chatVisible: 'boolean',
  resultsVisible: 'boolean',
  chatPosition: '"right" | "bottom"',
  resultsPosition: '"bottom" | "right"',
})

export type LayoutPreset = typeof layoutPresetType.infer

export const layoutStateType = type({
  version: 'number',
  sidebarVisible: 'boolean',
  chatVisible: 'boolean',
  editorVisible: 'boolean',
  resultsVisible: 'boolean',
  chatPosition: '"right" | "bottom"',
  resultsPosition: '"bottom" | "right"',
  activeLayoutId: 'string | null',
  layouts: layoutPresetType.array(),
})

export type LayoutState = typeof layoutStateType.infer

export const BUILT_IN_LAYOUTS: LayoutPreset[] = [
  {
    id: 'editor-results-chat-right',
    name: 'Editor + Results + Chat (Right)',
    isBuiltIn: true,
    sidebarVisible: true,
    chatVisible: true,
    resultsVisible: true,
    chatPosition: 'right',
    resultsPosition: 'bottom',
  },
  {
    id: 'editor-chat-right',
    name: 'Editor + Chat (Right)',
    isBuiltIn: true,
    sidebarVisible: true,
    chatVisible: true,
    resultsVisible: false,
    chatPosition: 'right',
    resultsPosition: 'bottom',
  },
  {
    id: 'editor-results-no-chat',
    name: 'Editor + Results (No Chat)',
    isBuiltIn: true,
    sidebarVisible: true,
    chatVisible: false,
    resultsVisible: true,
    chatPosition: 'right',
    resultsPosition: 'bottom',
  },
  {
    id: 'focus-editor',
    name: 'Focus Editor',
    isBuiltIn: true,
    sidebarVisible: false,
    chatVisible: false,
    resultsVisible: false,
    chatPosition: 'right',
    resultsPosition: 'bottom',
  },
  {
    id: 'chat-bottom',
    name: 'Editor + Results + Chat (Bottom)',
    isBuiltIn: true,
    sidebarVisible: true,
    chatVisible: true,
    resultsVisible: true,
    chatPosition: 'bottom',
    resultsPosition: 'bottom',
  },
]

const STORAGE_KEY = 'conar-layout-store'

const defaultState: LayoutState = {
  version: LAYOUT_STORE_VERSION,
  sidebarVisible: true,
  chatVisible: true,
  editorVisible: true,
  resultsVisible: true,
  chatPosition: 'right',
  resultsPosition: 'bottom',
  activeLayoutId: 'editor-results-chat-right',
  layouts: [...BUILT_IN_LAYOUTS],
}

function loadPersistedState(): LayoutState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored)
      return defaultState

    const parsed = JSON.parse(stored)

    if (parsed.version !== LAYOUT_STORE_VERSION) {
      return defaultState
    }

    const validated = layoutStateType(parsed)
    if (validated instanceof type.errors) {
      console.error('Invalid layout store state', validated.summary)
      return defaultState
    }

    const userLayouts = validated.layouts.filter(l => !l.isBuiltIn)
    validated.layouts = [...BUILT_IN_LAYOUTS, ...userLayouts]

    return validated
  }
  catch (e) {
    console.error('Failed to load layout store', e)
    return defaultState
  }
}

export const layoutStore = new Store<LayoutState>(loadPersistedState())

layoutStore.subscribe(({ currentVal }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentVal))
  }
  catch (e) {
    console.error('Failed to persist layout store', e)
  }
})

export function toggleSidebar() {
  layoutStore.setState(state => ({
    ...state,
    sidebarVisible: !state.sidebarVisible,
    activeLayoutId: null,
  } satisfies typeof state))
}

export function toggleChat() {
  layoutStore.setState(state => ({
    ...state,
    chatVisible: !state.chatVisible,
    activeLayoutId: null,
  } satisfies typeof state))
}

export function toggleResults() {
  layoutStore.setState(state => ({
    ...state,
    resultsVisible: !state.resultsVisible,
    activeLayoutId: null,
  } satisfies typeof state))
}

export function toggleEditor() {
  layoutStore.setState(state => ({
    ...state,
    editorVisible: !state.editorVisible,
    activeLayoutId: null,
  } satisfies typeof state))
}

export function setChatPosition(position: 'right' | 'bottom') {
  layoutStore.setState(state => ({
    ...state,
    chatPosition: position,
    activeLayoutId: null,
  } satisfies typeof state))
}

export function setResultsPosition(position: 'bottom' | 'right') {
  layoutStore.setState(state => ({
    ...state,
    resultsPosition: position,
    activeLayoutId: null,
  } satisfies typeof state))
}

export function applyLayout(layoutId: string) {
  const layout = layoutStore.state.layouts.find(l => l.id === layoutId)
  if (!layout)
    return

  layoutStore.setState(state => ({
    ...state,
    sidebarVisible: layout.sidebarVisible,
    chatVisible: layout.chatVisible,
    resultsVisible: layout.resultsVisible,
    chatPosition: layout.chatPosition,
    resultsPosition: layout.resultsPosition,
    activeLayoutId: layoutId,
  } satisfies typeof state))
}

export function createLayout(name: string): string {
  const id = `custom-${Date.now()}`
  const { sidebarVisible, chatVisible, resultsVisible, chatPosition, resultsPosition } = layoutStore.state

  const newLayout: LayoutPreset = {
    id,
    name,
    isBuiltIn: false,
    sidebarVisible,
    chatVisible,
    resultsVisible,
    chatPosition,
    resultsPosition,
  }

  layoutStore.setState(state => ({
    ...state,
    layouts: [...state.layouts, newLayout],
    activeLayoutId: id,
  } satisfies typeof state))

  return id
}

export function renameLayout(layoutId: string, newName: string) {
  layoutStore.setState(state => ({
    ...state,
    layouts: state.layouts.map(l =>
      l.id === layoutId && !l.isBuiltIn
        ? { ...l, name: newName }
        : l,
    ),
  } satisfies typeof state))
}

export function deleteLayout(layoutId: string) {
  layoutStore.setState(state => ({
    ...state,
    layouts: state.layouts.filter(l => l.id !== layoutId || l.isBuiltIn),
    activeLayoutId: state.activeLayoutId === layoutId ? null : state.activeLayoutId,
  } satisfies typeof state))
}

export function updateLayoutFromCurrentState(layoutId: string) {
  const { sidebarVisible, chatVisible, resultsVisible, chatPosition, resultsPosition } = layoutStore.state

  layoutStore.setState(state => ({
    ...state,
    layouts: state.layouts.map(l =>
      l.id === layoutId && !l.isBuiltIn
        ? { ...l, sidebarVisible, chatVisible, resultsVisible, chatPosition, resultsPosition }
        : l,
    ),
  } satisfies typeof state))
}

export function nextLayout() {
  const { layouts, activeLayoutId } = layoutStore.state
  if (layouts.length === 0)
    return
  const currentIndex = layouts.findIndex(l => l.id === activeLayoutId)
  const nextIndex = (currentIndex + 1) % layouts.length
  const nextLayout = layouts[nextIndex]
  if (nextLayout) {
    applyLayout(nextLayout.id)
  }
}

export function previousLayout() {
  const { layouts, activeLayoutId } = layoutStore.state
  if (layouts.length === 0)
    return
  const currentIndex = layouts.findIndex(l => l.id === activeLayoutId)
  const prevIndex = (currentIndex - 1 + layouts.length) % layouts.length
  const prevLayout = layouts[prevIndex]
  if (prevLayout) {
    applyLayout(prevLayout.id)
  }
}

export function resetToDefaultLayout() {
  applyLayout('editor-results-chat-right')
}
