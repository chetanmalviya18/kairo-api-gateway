import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { Route, Building2, ShieldCheck, LogOut, Network } from 'lucide-react'

export default function TenantLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const username = useAppSelector((s) => s.auth.username)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
      isActive
        ? 'bg-kairo-green text-white shadow-sm'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="flex min-h-screen bg-kairo-cream text-foreground">
      {/* Sidebar styled with #003566 Navy */}
      <aside className="w-64 bg-kairo-navy text-white flex flex-col shadow-xl z-20">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-kairo-green flex items-center justify-center text-white shadow-inner font-black text-lg">
              K
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-base text-white">Kairo</span>
                <span className="w-1.5 h-1.5 rounded-full bg-kairo-green"></span>
              </div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-white/60">
                Tenant Portal
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-white/80 border border-white/10">
            Tenant
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Gateway Config
          </div>

          <NavLink to="/tenant/routes" className={navClass}>
            <Route size={17} />
            <span>Routes</span>
          </NavLink>

          <NavLink to="/tenant/organization" className={navClass}>
            <Building2 size={17} />
            <span>Organization</span>
          </NavLink>

          <NavLink to="/tenant/audit-records" className={navClass}>
            <ShieldCheck size={17} />
            <span>Audit Records</span>
          </NavLink>
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center text-xs font-bold uppercase border border-white/20">
                {username?.[0] || 'T'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {username || 'Tenant Admin'}
                </span>
                <span className="text-[10px] text-white/50 flex items-center gap-1">
                  <Network size={10} className="text-kairo-green-light" /> Tenant Admin
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content surface with #fffcf2 Cream background */}
      <main className="flex-1 overflow-auto p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}
