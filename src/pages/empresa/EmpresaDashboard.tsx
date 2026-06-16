import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, Users, Wallet } from "lucide-react"

import { listEmpleados } from "@/api/empleados"
import { listNominas } from "@/api/nomina"
import { formatCOP } from "@/lib/utils"
import type { Nomina } from "@/types/nomina"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function fmtDate(value: string) {
  return format(new Date(value), "dd MMM yyyy", { locale: es })
}

function EstadoBadge({ estado }: { estado: Nomina["estado"] }) {
  if (estado === "cerrada") {
    return <Badge className="bg-green-600 hover:bg-green-600">Cerrada</Badge>
  }
  return (
    <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
      Borrador
    </Badge>
  )
}

export default function EmpresaDashboard() {
  const { empresaId } = useParams<{ empresaId: string }>()
  const navigate = useNavigate()
  const base = `/empresa/${empresaId}`

  const { data: empleados } = useQuery({
    queryKey: ["empleados", empresaId],
    queryFn: () => listEmpleados(empresaId!),
    enabled: !!empresaId,
  })

  const { data: nominas } = useQuery({
    queryKey: ["nominas", empresaId],
    queryFn: () => listNominas(empresaId!),
    enabled: !!empresaId,
  })

  const empleadosActivos = useMemo(
    () => (empleados ?? []).filter((e) => e.activo).length,
    [empleados]
  )

  const nominasOrdenadas = useMemo(
    () =>
      [...(nominas ?? [])].sort(
        (a, b) =>
          new Date(b.periodo_fin).getTime() - new Date(a.periodo_fin).getTime()
      ),
    [nominas]
  )

  const ultimaNomina = nominasOrdenadas[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`${base}/empleados`)}>
            Ver Empleados
          </Button>
          <Button onClick={() => navigate(`${base}/nomina`)}>
            Generar Nómina
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Empleados Activos"
          value={String(empleadosActivos)}
          icon={Users}
        />
        <StatCard
          label="Última Nómina"
          value={ultimaNomina ? fmtDate(ultimaNomina.periodo_fin) : "Sin nóminas"}
          icon={FileText}
        />
        <StatCard
          label="Costo Último Mes"
          value={ultimaNomina ? formatCOP(ultimaNomina.total_neto) : "—"}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nóminas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {nominasOrdenadas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay nóminas registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Total Devengado</TableHead>
                  <TableHead className="text-right">Total Deducciones</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominasOrdenadas.slice(0, 5).map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      {fmtDate(n.periodo_inicio)} – {fmtDate(n.periodo_fin)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCOP(n.total_devengado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCOP(n.total_deducciones)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCOP(n.total_neto)}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={n.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}
