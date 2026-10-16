import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'bg-raised text-ink text-sm rounded-xl px-3.5 py-3 outline-none focus:ring-2 focus:ring-live placeholder-ink-3'

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-2xl p-7">
        <h1 className="text-xl font-semibold text-ink tracking-tight mb-1">
          Tracker
        </h1>
        <p className="text-ink-3 text-sm mb-6">
          Sign in to track your working hours
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="bg-ink text-canvas rounded-xl py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition mt-1"
          >
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-ink-3 text-xs mt-3 hover:text-ink-2 transition"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-line flex-1" />
          <span className="text-ink-3 text-[11px]">OR</span>
          <div className="h-px bg-line flex-1" />
        </div>

        <button
          type="button"
          onClick={() => loginWithGoogle().catch((err) => setError(err.message))}
          className="w-full bg-raised text-ink rounded-xl py-3 text-sm font-medium hover:bg-line transition"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
