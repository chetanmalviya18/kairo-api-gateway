import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { setCredentials } from '@/features/auth/authSlice'
import { login } from '@/features/auth/authApi'
import { ArrowRight, Lock, User, AlertCircle, KeyRound } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-kairo-cream p-4 relative overflow-hidden">
      {/* Decorative background aura */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-kairo-navy/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-kairo-green/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-kairo-cream-border/80 rounded-2xl p-8 md:p-10 shadow-xl shadow-kairo-navy/5 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-kairo-navy text-white flex items-center justify-center font-black text-2xl shadow-md mb-4 border border-kairo-navy/20 relative">
            <span>K</span>
            <span className="w-2.5 h-2.5 rounded-full bg-kairo-green absolute -top-1 -right-1 border-2 border-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-kairo-navy">Kairo Gateway</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Sign in to access your API gateway control plane
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3 text-muted-foreground" />
              <input
                className="w-full border border-kairo-cream-border rounded-lg pl-10 pr-3.5 py-2.5 text-sm bg-kairo-cream/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition-all"
                value={username}
                placeholder="admin or tenant-admin"
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-muted-foreground" />
              <input
                type="password"
                className="w-full border border-kairo-cream-border rounded-lg pl-10 pr-3.5 py-2.5 text-sm bg-kairo-cream/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition-all"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              <AlertCircle size={15} />
              <span>Invalid username or password. Please try again.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-kairo-navy hover:bg-kairo-navy-light text-white rounded-lg px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-50 mt-2"
          >
            <span>{isPending ? 'Authenticating…' : 'Sign In to Gateway'}</span>
            {!isPending && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-kairo-cream-border text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <KeyRound size={12} className="text-kairo-green" />
            Stateless OAuth2 JWT authentication
          </p>
        </div>
      </div>
    </div>
  )
}
