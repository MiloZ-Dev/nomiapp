import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { ProtectedRoute } from "./ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { getHomePathForUser } from "@/context/auth-context"

const LoginPage = lazy(() => import("@/pages/LoginPage"))
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))
const EmpresaLayout = lazy(() => import("@/pages/empresa/EmpresaLayout"))
const EmpresaDashboard = lazy(() => import("@/pages/empresa/EmpresaDashboard"))
const Empleados = lazy(() => import("@/pages/empresa/Empleados"))
const EmpleadoForm = lazy(() => import("@/pages/empresa/EmpleadoForm"))
const Incidentes = lazy(() => import("@/pages/empresa/Incidentes"))
const NominaPage = lazy(() => import("@/pages/empresa/Nomina"))

function PageFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>
}

/** Sends the app root to the right home area based on the user's role. */
function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? getHomePathForUser(user) : "/login"} replace />
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <RootRedirect /> },
      {
        element: <ProtectedRoute requiredRole="super_admin" />,
        children: [
          { path: "/dashboard", element: withSuspense(<DashboardPage />) },
        ],
      },
      {
        path: "/empresa/:empresaId",
        element: withSuspense(<EmpresaLayout />),
        children: [
          { index: true, element: withSuspense(<EmpresaDashboard />) },
          { path: "empleados", element: withSuspense(<Empleados />) },
          { path: "empleados/nuevo", element: withSuspense(<EmpleadoForm />) },
          {
            path: "empleados/:empleadoId/edit",
            element: withSuspense(<EmpleadoForm />),
          },
          {
            path: "empleados/:empleadoId/novedades",
            element: withSuspense(<Incidentes />),
          },
          { path: "nomina", element: withSuspense(<NominaPage />) },
        ],
      },
    ],
  },
  { path: "/404", element: withSuspense(<NotFoundPage />) },
  { path: "*", element: <Navigate to="/404" replace /> },
])
