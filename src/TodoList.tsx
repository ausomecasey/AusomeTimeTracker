import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { applyListKind, explainTodoWriteError, handleEnter, wrapSelection } from './todoText'
import type { TodoStore } from './types'

type TodoListProps = {
  store: TodoStore
}

type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

export function TodoList({ store }: TodoListProps) {
  const [text, setText] = useState('')
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [error, setError] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const textRef = useRef('')
  const savedRef = useRef('')
  const inflightRef = useRef(false)
  const queuedRef = useRef<string | null>(null)
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError('')
    store
      .load()
      .then((result) => {
        if (cancelled) return
        setText(result.body)
        textRef.current = result.body
        savedRef.current = result.body
        setStatus(result.warning ? 'error' : 'saved')
        setError(result.warning ?? '')
        setReady(true)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setReady(true)
        setStatus('error')
        setError(explainTodoWriteError(loadError, 'load'))
      })
    return () => {
      cancelled = true
    }
  }, [store])

  async function flush(next: string) {
    if (inflightRef.current) {
      queuedRef.current = next
      return
    }
    if (next === savedRef.current) {
      setStatus('saved')
      return
    }

    inflightRef.current = true
    setStatus('saving')
    setError('')
    try {
      await storeRef.current.save(next)
      savedRef.current = next
      const queued = queuedRef.current
      queuedRef.current = null
      inflightRef.current = false
      if (queued !== null && queued !== next) {
        await flush(queued)
        return
      }
      setStatus(textRef.current === next ? 'saved' : 'dirty')
    } catch (saveError: unknown) {
      inflightRef.current = false
      setStatus('error')
      setError(explainTodoWriteError(saveError, 'save'))
    }
  }

  useEffect(() => {
    if (!ready) return
    if (text === savedRef.current) return
    setStatus('dirty')
    const timer = window.setTimeout(() => {
      void flush(text)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [ready, text])

  useEffect(() => {
    function saveNow() {
      if (textRef.current !== savedRef.current) void flush(textRef.current)
    }
    function onHide() {
      if (document.visibilityState === 'hidden') saveNow()
    }
    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', saveNow)
      document.removeEventListener('visibilitychange', onHide)
      saveNow()
    }
  }, [])

  function applyEdit(next: { text: string; start: number; end: number }) {
    textRef.current = next.text
    setText(next.text)
    setStatus(next.text === savedRef.current ? 'saved' : 'dirty')
    requestAnimationFrame(() => {
      const area = areaRef.current
      if (!area) return
      area.focus()
      area.setSelectionRange(next.start, next.end)
    })
  }

  function currentDoc() {
    const area = areaRef.current
    return {
      text,
      start: area?.selectionStart ?? text.length,
      end: area?.selectionEnd ?? text.length,
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault()
      applyEdit(wrapSelection(currentDoc(), '**'))
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault()
      applyEdit(wrapSelection(currentDoc(), '_'))
      return
    }
    if (event.key !== 'Enter' || event.shiftKey) return
    const next = handleEnter(currentDoc())
    if (!next) return
    event.preventDefault()
    applyEdit(next)
  }

  const statusLabel =
    status === 'saving'
      ? 'Saving…'
      : status === 'dirty'
        ? 'Saving soon'
        : status === 'error'
          ? 'Couldn’t save'
          : 'Saved'

  return (
    <main className="todo">
      <div className="todo-toolbar">
        <div className="todo-marks">
          <button className="ghost todo-mark" type="button" onClick={() => applyEdit(wrapSelection(currentDoc(), '**'))}>
            Bold
          </button>
          <button className="ghost todo-mark" type="button" onClick={() => applyEdit(wrapSelection(currentDoc(), '_'))}>
            Italic
          </button>
          <button className="ghost todo-mark" type="button" onClick={() => applyEdit(applyListKind(currentDoc(), 'bullet'))}>
            •
          </button>
          <button className="ghost todo-mark" type="button" onClick={() => applyEdit(applyListKind(currentDoc(), 'number'))}>
            1.
          </button>
          <button className="ghost todo-mark" type="button" onClick={() => applyEdit(applyListKind(currentDoc(), 'letter'))}>
            a.
          </button>
        </div>
        <p className="todo-status" aria-live="polite">
          {statusLabel}
        </p>
      </div>
      {error ? <p className="banner">{error}</p> : null}
      <label className="todo-field">
        <span className="sr-only">Master to-do list</span>
        <textarea
          ref={areaRef}
          className="todo-page"
          value={text}
          disabled={!ready}
          spellCheck
          placeholder={'Write your running to-do list.\nPress Enter to continue a list like - , 1. , or a.'}
          onChange={(event) => {
            textRef.current = event.target.value
            setText(event.target.value)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (textRef.current !== savedRef.current) void flush(textRef.current)
          }}
        />
      </label>
    </main>
  )
}
