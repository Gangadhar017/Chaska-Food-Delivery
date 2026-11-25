import { useState } from 'react'
import { useSession } from '../app/session.jsx'
import { useMeta } from '../lib/queries.js'
import { Notice, Spinner } from './bits.jsx'

/** Sign in, create an account, or step in with the demo account. */
export default function AuthForm({ onDone, initialMode = 'signin' }) {
  const { signIn, signUp } = useSession()
  const { data: meta } = useMeta()
  const [mode, setMode] = useState(initialMode)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const creating = mode === 'signup'

  async function run(kind, action) {
    setBusy(kind)
    setError(null)
    try {
      const user = await action()
      onDone?.(user)
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(null)
    }
  }

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    const password = form.get('password')
    if (creating) run('form', () => signUp({ name: form.get('name'), email, password, phone: form.get('phone') }))
    else run('form', () => signIn(email, password))
  }

  const field = error?.details?.field
  const invalid = (name) => (field && field.toLowerCase() === name ? 'true' : undefined)

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 rounded-lg border border-line bg-sunken p-1" role="tablist" aria-label="Account">
        {[['signin', 'Sign in'], ['signup', 'Create account']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => { setMode(key); setError(null) }}
            className={`h-9 rounded-md text-[0.95rem] font-semibold transition-colors ${mode === key ? 'bg-card text-ink' : 'text-soft hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="grid gap-3.5" noValidate>
        {creating && (
          <div>
            <label className="label" htmlFor="auth-name">Full name</label>
            <input id="auth-name" name="name" className="field" autoComplete="name" required aria-invalid={invalid('name')} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="auth-email">Email</label>
          <input id="auth-email" name="email" type="email" className="field" autoComplete="email" required aria-invalid={invalid('email')} />
        </div>
        {creating && (
          <div>
            <label className="label" htmlFor="auth-phone">Mobile number <span className="font-normal text-faint">(optional)</span></label>
            <input id="auth-phone" name="phone" type="tel" inputMode="numeric" className="field" autoComplete="tel-national" placeholder="10 digits" aria-invalid={invalid('phone')} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" className="field" autoComplete={creating ? 'new-password' : 'current-password'} required minLength={creating ? 8 : undefined} aria-invalid={invalid('password')} />
          {creating && <p className="mt-1 text-sm text-faint">At least 8 characters.</p>}
        </div>

        {error && <Notice tone="bad"><span role="alert">{error.message}</span></Notice>}

        <button type="submit" className="btn btn-primary mt-1" disabled={Boolean(busy)}>
          {busy === 'form' && <Spinner />}
          {creating ? 'Create account' : 'Sign in'}
        </button>
      </form>

      {meta?.demoAccount && (
        <>
          <div className="my-4 flex items-center gap-3 text-sm text-faint">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <button type="button" className="btn btn-outline w-full" disabled={Boolean(busy)} onClick={() => run('demo', () => signIn(meta.demoAccount.email, meta.demoAccount.password))}>
            {busy === 'demo' && <Spinner />}
            Continue with the demo account
          </button>
          <p className="mt-2 text-center text-sm text-faint">It comes with two saved addresses, so you can order straight away.</p>
        </>
      )}
    </div>
  )
}
