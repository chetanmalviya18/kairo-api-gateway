import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { setCredentials } from '@/features/auth/authSlice'
import { login } from '@/features/auth/authApi'
import KairoLogo from '@/components/common/KairoLogo'
import './LoginPage.css'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: (data, variables) => {
      dispatch(
        setCredentials({
          token: data.token,
          tokenType: data.tokenType,
          role: data.role as 'PLATFORM_ADMIN' | 'TENANT_ADMIN',
          username: variables.username,
          organizationId: data.organizationId,
        })
      )
      if (data.role === 'PLATFORM_ADMIN') navigate('/platform')
      else navigate('/tenant')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    mutate({ username: username.trim(), password })
  }

  return (
    <div className="login-shell">
      {/* ================= LEFT PARTITION: STORY ================= */}
      <section className="login-story">
        <a className="brand" href="/" aria-label="Kairo Gateway Home">
          <KairoLogo size="lg" subtitle="GATEWAY" theme="dark" />
        </a>

        <div className="story-copy">
          <p className="eyebrow">EDGE TRAFFIC & INGRESS MESH</p>
          <h1>
            Dynamic edge routing.<br />Zero-trust tenancy.
          </h1>
          <p className="story-lead">
            Configure upstream microservice routes, enforce granular header rules, and govern tenant organizations with sub-millisecond precision.
          </p>

          <div className="architecture-strip" aria-label="Kairo architecture flow">
            <div>
              <span>01</span>
              <strong>Ingress</strong>
              <small>Path & rewrite</small>
            </div>
            <i />
            <div>
              <span>02</span>
              <strong>Isolate</strong>
              <small>Multi-tenant JWT</small>
            </div>
            <i />
            <div>
              <span>03</span>
              <strong>Govern</strong>
              <small>Policies & audits</small>
            </div>
          </div>
        </div>

        <p className="story-footer">Kairo · Enterprise API Gateway Control Plane</p>
      </section>

      {/* ================= RIGHT PARTITION: LOGIN PANEL ================= */}
      <section className="login-panel">
        <form onSubmit={handleSubmit} className="login-card">
          <div className="login-card-header">
            <p className="eyebrow">GATEWAY CONTROL PLANE</p>
            <h2>Sign In</h2>
            <p className="muted">Enter your administrative credentials to manage routes and policies.</p>
          </div>

          <label className="field">
            <span>Username</span>
            <input
              id="loginUsername"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="admin or tenant-admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>
            <span className="password-wrap">
              <input
                id="loginPassword"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="text-button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          {error && (
            <p className="form-error">
              Invalid credentials. Please verify your username and password.
            </p>
          )}

          <button
            id="loginButton"
            className="button-wide"
            type="submit"
            disabled={isPending || !username.trim() || !password}
          >
            {isPending ? (
              <span className="button-loading">
                <span className="button-spinner" aria-hidden="true" />
                <span>Authenticating…</span>
              </span>
            ) : (
              <>
                <span>Authenticate & Continue</span>
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  )
}
