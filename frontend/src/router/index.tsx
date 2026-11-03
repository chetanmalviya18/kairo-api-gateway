import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import LoginPage from '@/pages/LoginPage'

import PlatformLayout from '@/pages/platform/PlatformLayout'
import OrganizationsPage from '@/pages/platform/OrganizationsPage'
import OrganizationDetailPage from '@/pages/platform/OrganizationDetailPage'
import TenantAdminsPage from '@/pages/platform/TenantAdminsPage'

import TenantLayout from '@/pages/tenant/TenantLayout'
import TenantOrganizationPage from '@/pages/tenant/TenantOrganizationPage'
import RoutesPage from '@/pages/tenant/RoutesPage'
import HeaderRulesPage from '@/pages/tenant/HeaderRulesPage'
import TenantAuditRecordsPage from '@/pages/tenant/TenantAuditRecordsPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <div className="p-8 text-red-500">403 — Unauthorized</div> },

  // Platform Admin routes
  {
    element: <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']} />,
    children: [
      {
        path: '/platform',
        element: <PlatformLayout />,
        children: [
          { index: true, element: <Navigate to="organizations" replace /> },
          { path: 'organizations', element: <OrganizationsPage /> },
          { path: 'organizations/:orgId', element: <OrganizationDetailPage /> },
          { path: 'organizations/:orgId/admin', element: <TenantAdminsPage /> },
        ],
      },
    ],
  },

  // Tenant Admin routes
  {
    element: <ProtectedRoute allowedRoles={['TENANT_ADMIN']} />,
    children: [
      {
        path: '/tenant',
        element: <TenantLayout />,
        children: [
          { index: true, element: <Navigate to="routes" replace /> },
          { path: 'routes', element: <RoutesPage /> },
          { path: 'routes/:routeId/header-rules', element: <HeaderRulesPage /> },
          { path: 'organization', element: <TenantOrganizationPage /> },
          { path: 'audit-records', element: <TenantAuditRecordsPage /> },
        ],
      },
    ],
  },

  // Default redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <div className="p-8 text-gray-500">404 — Not Found</div> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
