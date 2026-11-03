import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { Route, Building2, ShieldCheck } from 'lucide-react'
import KairoLogo from '@/components/common/KairoLogo'

export default function TenantLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const username = useAppSelector((s) => s.auth.username)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'TA'

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <a className="brand" href="/tenant/routes">
          <KairoLogo size="sm" subtitle="TENANT" theme="dark" />
        </a>

        <nav className="navigation" aria-label="Main navigation">
          <NavLink
            to="/tenant/routes"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Route size={16} />
            <span>Routes</span>
          </NavLink>

          <NavLink
            to="/tenant/organization"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Building2 size={16} />
            <span>My Organization</span>
          </NavLink>

          <NavLink
            to="/tenant/audit-records"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <ShieldCheck size={16} />
            <span>Audit Records</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div>
            <strong title={username || 'tenant-admin'}>{username || 'tenant-admin'}</strong>
            <span>Tenant admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="icon-button"
            type="button"
            title="Sign out"
            aria-label="Sign out"
          >
            ↗
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">KAIRO / TENANT</p>
            <h2>Gateway Configuration</h2>
          </div>
          <div className="topbar-meta">
            <span className="live-indicator">
              <i /> API connected
            </span>
            <span className="role-badge">TENANT_ADMIN</span>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
