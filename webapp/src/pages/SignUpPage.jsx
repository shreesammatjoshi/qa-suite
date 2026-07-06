import { useState } from 'react'
import { Link } from 'react-router-dom'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STRONG_PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export default function SignUpPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required'
    else if (form.fullName.trim().length < 2) next.fullName = 'Full name is too short'

    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address'

    if (!form.password) next.password = 'Password is required'
    else if (!STRONG_PW_RE.test(form.password))
      next.password = 'Password needs 8+ chars, upper, lower and a number'

    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password'
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match'

    if (!form.agreeTerms) next.agreeTerms = 'You must accept the terms'

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
      setBanner({ type: 'success', text: `Account created for ${form.email.trim()}.` })
      setForm({ fullName: '', email: '', password: '', confirmPassword: '', agreeTerms: false })
    }, 300)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" data-testid="signup-card">
        <div className="spec-tab">
          <span className="dots">
            <span className="dot red" />
            <span className="dot amber" />
            <span className="dot green" />
          </span>
          <span className="filename">tests/signup.spec.js</span>
          <span className="status-chip">10 passed</span>
        </div>

        <div className="auth-body">
        <h1>Create account</h1>
        <p className="subtitle">Sign up to get started</p>

        {banner && (
          <div className={`form-banner ${banner.type}`} data-testid="signup-banner">
            {banner.text}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              data-testid="signup-name-input"
              type="text"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
            />
            {errors.fullName && (
              <div className="field-error" data-testid="signup-name-error">
                {errors.fullName}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              data-testid="signup-email-input"
              type="text"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
            {errors.email && (
              <div className="field-error" data-testid="signup-email-error">
                {errors.email}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              data-testid="signup-password-input"
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
            {errors.password && (
              <div className="field-error" data-testid="signup-password-error">
                {errors.password}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              data-testid="signup-confirm-input"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
            />
            {errors.confirmPassword && (
              <div className="field-error" data-testid="signup-confirm-error">
                {errors.confirmPassword}
              </div>
            )}
          </div>

          <div className="checkbox-row">
            <input
              id="signup-terms"
              type="checkbox"
              data-testid="signup-terms-checkbox"
              checked={form.agreeTerms}
              onChange={(e) => update('agreeTerms', e.target.checked)}
            />
            <label htmlFor="signup-terms">I agree to the terms</label>
          </div>
          {errors.agreeTerms && (
            <div className="field-error" data-testid="signup-terms-error">
              {errors.agreeTerms}
            </div>
          )}

          <button
            className="submit-btn"
            data-testid="signup-submit-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="switch-link">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
        </div>
      </div>
    </div>
  )
}
