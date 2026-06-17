import { NavLink, Outlet, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, FileText, LayoutDashboard, Users } from "lucide-react"

import { getCompany } from "@/api/companies"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmpresaLayout() {
  const { empresaId } = useParams<{ empresaId: string }>()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === "super_admin"

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", empresaId],
    queryFn: () => getCompany(empresaId!),
    enabled: !!empresaId,
  })

  const base = `/empresa/${empresaId}`
  const navItems = [
    { to: base, label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: `${base}/empleados`, label: "Empleados", icon: Users, end: false },
    { to: `${base}/nomina`, label: "Nómina", icon: FileText, end: false },
  ]

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
        {isSuperAdmin && (
          <>
            <NavLink
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Mis Empresas
            </NavLink>
            <Separator className="my-4" />
          </>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-6 w-36" />
          ) : (
            <p className="font-semibold leading-tight">{company?.name}</p>
          )}
          <Badge variant="secondary">
            {isSuperAdmin ? "Super Admin" : "Admin Empresa"}
          </Badge>
        </div>

        <Separator className="my-4" />

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
