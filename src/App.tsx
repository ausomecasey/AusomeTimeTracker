import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Apps } from './Apps'
import { AuthScreen } from './AuthScreen'
import {
  createMemoryStore,
  createMemoryTodoStore,
  createSupabaseStore,
  createSupabaseTodoStore,
  withLocalTodoCache,
} from './store'
import { isSupabaseConfigured, supabase } from './supabase'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [preview, setPreview] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview'),
  )
  const memoryStore = useMemo(() => createMemoryStore(), [])
  const memoryTodoStore = useMemo(() => withLocalTodoCache(createMemoryTodoStore()), [])
  const remoteStore = useMemo(() => (supabase ? createSupabaseStore(supabase) : null), [])
  const remoteTodoStore = useMemo(
    () => (supabase ? withLocalTodoCache(createSupabaseTodoStore(supabase)) : null),
    [],
  )

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setReady(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <main className="auth">
        <p className="lede">Loading…</p>
      </main>
    )
  }

  if (preview) {
    return <Apps entryStore={memoryStore} todoStore={memoryTodoStore} />
  }

  if (!session || !supabase || !remoteStore || !remoteTodoStore) {
    return <AuthScreen onPreview={import.meta.env.DEV ? () => setPreview(true) : undefined} />
  }

  const client = supabase

  return (
    <Apps
      entryStore={remoteStore}
      todoStore={remoteTodoStore}
      onSignOut={() => {
        void client.auth.signOut()
      }}
    />
  )
}
