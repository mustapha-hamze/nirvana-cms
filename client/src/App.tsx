import { type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAppSelector } from './store/hooks'
import { selectIsAuthenticated, selectUser } from './store/authSlice'
import Login from './pages/Login'
import Applications from './pages/Applications'
import SuperAdmins from './pages/SuperAdmins'
import Dashboard from './pages/Dashboard'
import AppUsers from './pages/AppUsers'
import Contents from './pages/Contents'
import Categories from './pages/Categories'
import Tags from './pages/Tags'
import ComingSoonPage from './pages/ComingSoonPage'
import AdminLayout from './components/AdminLayout'

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectUser)
  const { id } = useParams<{ id: string }>()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" replace />
  // Staff may only enter the admin panel for an application they're assigned to.
  if (id && user && user.role !== 'SuperAdmin') {
    const hasAccess = user.applications.some((a) => a._id === id)
    if (!hasAccess) return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RootRedirect() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectUser)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'SuperAdmin') return <Navigate to="/applications" replace />
  if (user && user.applications.length > 0) {
    return <Navigate to={`/applications/${user.applications[0]._id}/dashboard`} replace />
  }
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/applications"
          element={
            <ProtectedRoute roles={['SuperAdmin']}>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admins"
          element={
            <ProtectedRoute roles={['SuperAdmin']}>
              <SuperAdmins />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute roles={['SuperAdmin', 'WebSiteAdmin', 'WebSiteContentCreator']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['SuperAdmin']}>
                <AppUsers />
              </ProtectedRoute>
            }
          />
          <Route path="contents" element={<Contents />} />
          <Route path="pages" element={<ComingSoonPage title="Pages" description="Manage the pages that make up this application's site." />} />
          <Route
            path="categories"
            element={
              <ProtectedRoute roles={['SuperAdmin', 'WebSiteAdmin']}>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="tags"
            element={
              <ProtectedRoute roles={['SuperAdmin', 'WebSiteAdmin']}>
                <Tags />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
