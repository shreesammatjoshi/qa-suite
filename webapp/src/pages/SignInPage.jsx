import { useState } from 'react'
import { Link } from 'react-router-dom'

const VALID_EMAIL = 'qa@testsuite.dev'
const VALID_PASSWORD = 'QaPass#2026'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address'

    if (!password) next.password = 'Password is required'
    else if (password.length < 8) next.password = 'Password must be at least 8 characters'

    return next
  }

  function handleSubmit(e) {
    e.preventDefault()
    setBanner(null)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      if (email.trim() === VALID_EMAIL && password === VALID_PASSWORD) {
        setBanner({ type: 'success', text: 'Signed in successfully.' })
      } else {
        setBanner({ type: 'error', text: 'Invalid email or password.' })
      }
    }, 300)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" data-testid="signin-card">
        <div className="spec-tab">
          <span className="filename">tests/signin.spec.js</span>
          <span className="status-chip">9 passed</span>
        </div>

        <div className="auth-body">
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to continue</p>

        {banner && (
          <div className={`form-banner ${banner.type}`} data-testid="signin-banner">
            {banner.text}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              data-testid="signin-email-input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            {errors.email && (
              <div className="field-error" data-testid="signin-email-error">
                {errors.email}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              data-testid="signin-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && (
              <div className="field-error" data-testid="signin-password-error">
                {errors.password}
              </div>
            )}
          </div>

          <div className="checkbox-row">
            <input
              id="remember"
              type="checkbox"
              data-testid="signin-remember-checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">Remember me</label>
          </div>

          <button
            className="submit-btn"
            data-testid="signin-submit-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="switch-link">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </div>
        </div>
      </div>
    </div>
  )
}
