import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getHomePathForUser } from "@/context/auth-context"
import type { Rol } from "@/types/auth"

export function ProtectedRoute({ requiredRol }: { requiredRol?: Rol }) {
  const { user, isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Authenticated but wrong role: send the user to their own home area.
  if (requiredRol && user.rol !== requiredRol) {
    return <Navigate to={getHomePathForUser(user)} replace />
  }

  return <Outlet />
}
