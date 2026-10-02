import { useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'

type AuthScreenProps = {
  onPreview?: () => void
}

export function AuthScreen({ onPreview }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault()
    setError('')

    if (!isSupabaseConfigured || !supabase) {
      setError('Add your Supabase URL and key before signing in.')
      return
    }

    if (password.length < 6) {
      setError('Use a password of at least 6 characters.')
      return
    }

    setBusy(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError(signInError.message)
    setBusy(false)
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={submit}>
        <h1>Ausome Time Tracker</h1>
        <p className="lede">Sign in to record hours. The same account works on your phone and computer.</p>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary" type="submit" disabled={busy}>
          Sign in
        </button>
        {onPreview ? (
          <button className="linkish preview-link" type="button" onClick={onPreview}>
            Preview the tracker on this device
          </button>
        ) : null}
      </form>
    </main>
  )
}
