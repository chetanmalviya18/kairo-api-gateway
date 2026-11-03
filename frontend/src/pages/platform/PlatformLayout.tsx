import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { Building2, LogOut } from 'lucide-react'

export default function PlatformLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const username = useAppSelector((s) => s.auth.username)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    }`

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="font-bold text-lg">Kairo</h1>
          <p className="text-xs text-muted-foreground mt-1">Platform Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/platform/organizations" className={navClass}>
            <Building2 size={16} /> Organizations
          </NavLink>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold uppercase">
                {username?.[0]}
              </div>
              <span className="text-sm font-medium truncate max-w-[100px]">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-muted p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
