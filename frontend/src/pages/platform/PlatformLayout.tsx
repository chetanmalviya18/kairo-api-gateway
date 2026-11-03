import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { Building2 } from 'lucide-react'
import KairoLogo from '@/components/common/KairoLogo'

export default function PlatformLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const username = useAppSelector((s) => s.auth.username)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'PA'

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <a className="brand" href="/platform/organizations">
          <KairoLogo size="sm" subtitle="PLATFORM" theme="dark" />
        </a>

        <nav className="navigation" aria-label="Main navigation">
          <NavLink
            to="/platform/organizations"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Building2 size={16} />
            <span>Organizations</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div>
            <strong title={username || 'platform-admin'}>{username || 'platform-admin'}</strong>
            <span>Platform admin</span>
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
            <p className="eyebrow">KAIRO / PLATFORM</p>
            <h2>Tenant Directory</h2>
          </div>
          <div className="topbar-meta">
            <span className="live-indicator">
              <i /> API connected
            </span>
            <span className="role-badge">PLATFORM_ADMIN</span>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
