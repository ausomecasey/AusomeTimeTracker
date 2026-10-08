import { useEffect, useState } from 'react'
import { TodoList } from './TodoList'
import { Tracker } from './Tracker'
import type { EntryStore, TodoStore } from './types'

export type AppTab = 'tracker' | 'todo'

function tabFromHash(): AppTab {
  return window.location.hash === '#todo' ? 'todo' : 'tracker'
}

type AppsProps = {
  entryStore: EntryStore
  todoStore: TodoStore
  onSignOut?: () => void
}

export function Apps({ entryStore, todoStore, onSignOut }: AppsProps) {
  const [tab, setTab] = useState<AppTab>(tabFromHash)

  useEffect(() => {
    function onHash() {
      setTab(tabFromHash())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function selectTab(next: AppTab) {
    setTab(next)
    const hash = next === 'todo' ? '#todo' : '#tracker'
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }

  return (
    <div className="shell">
      <header className="shell-top">
        <div className="brand-row">
          <p className="brand">
            <span className="brand-swatches" aria-hidden="true">
              <i className="navy" />
              <i className="orange" />
            </span>
            Ausome Apps
          </p>
          {onSignOut ? (
            <button className="linkish" type="button" onClick={onSignOut}>
              Sign out
            </button>
          ) : null}
        </div>
        <nav className="tabs" aria-label="Apps">
          <button
            className={tab === 'tracker' ? 'tab active' : 'tab'}
            type="button"
            aria-pressed={tab === 'tracker'}
            onClick={() => selectTab('tracker')}
          >
            Ausome Time Tracker
          </button>
          <button
            className={tab === 'todo' ? 'tab active' : 'tab'}
            type="button"
            aria-pressed={tab === 'todo'}
            onClick={() => selectTab('todo')}
          >
            Ausome To-Do List
          </button>
        </nav>
      </header>
      <div className="shell-body">
        {tab === 'tracker' ? <Tracker store={entryStore} /> : <TodoList store={todoStore} />}
      </div>
    </div>
  )
}
