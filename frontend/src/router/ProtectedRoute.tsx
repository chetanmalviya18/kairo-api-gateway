import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'

interface Props {
  allowedRoles: string[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { token, role } = useAppSelector((s) => s.auth)

  if (!token) return <Navigate to="/login" replace />
  if (role && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}

