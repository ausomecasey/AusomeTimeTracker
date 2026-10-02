import { useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'

type AuthScreenProps = {
  onPreview?: () => void
}

export function AuthScreen({ onPreview }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: { preventDefault(): void }, mode: 'sign-in' | 'sign-up') {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!isSupabaseConfigured || !supabase) {
      setError('Add your Supabase URL and key before signing in.')
      return
    }

    if (password.length < 6) {
      setError('Use a password of at least 6 characters.')
      return
    }

    setBusy(true)
    if (mode === 'sign-in') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(signInError.message)
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) setError(signUpError.message)
      else if (!data.session) {
        setNotice('Check your email to confirm the account, then sign in.')
      }
    }
    setBusy(false)
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={(event) => submit(event, 'sign-in')}>
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
        {notice ? <p className="notice">{notice}</p> : null}
        <button className="primary" type="submit" disabled={busy}>
          Sign in
        </button>
        <button
          className="ghost"
          type="button"
          disabled={busy}
          onClick={(event) => submit(event, 'sign-up')}
        >
          Create account
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
