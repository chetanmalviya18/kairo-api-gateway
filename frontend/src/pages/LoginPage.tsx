import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { setCredentials } from '@/features/auth/authSlice'
import { login } from '@/features/auth/authApi'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

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
    mutate({ username, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Kairo</h1>
        <p className="text-muted-foreground text-sm mb-6">API Gateway — Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-destructive text-sm">
              Invalid credentials. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
