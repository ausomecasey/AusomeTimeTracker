import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthScreen } from './AuthScreen'
import { Tracker } from './Tracker'
import { createMemoryStore, createSupabaseStore } from './store'
import { isSupabaseConfigured, supabase } from './supabase'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [preview, setPreview] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview'),
  )
  const memoryStore = useMemo(() => createMemoryStore(), [])
  const remoteStore = useMemo(
    () => (supabase ? createSupabaseStore(supabase) : null),
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
    return <Tracker store={memoryStore} />
  }

  if (!session || !supabase || !remoteStore) {
    return <AuthScreen onPreview={import.meta.env.DEV ? () => setPreview(true) : undefined} />
  }

  const client = supabase

  return (
    <Tracker
      store={remoteStore}
      onSignOut={() => {
        void client.auth.signOut()
      }}
    />
  )
}
