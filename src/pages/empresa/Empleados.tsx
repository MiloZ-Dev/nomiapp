import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus, Users } from "lucide-react"

import { listEmpleados } from "@/api/empleados"
import { TIPO_CONTRATO_LABEL } from "@/types/empleado"
import { formatCOP } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Empleados() {
  const { empresaId } = useParams<{ empresaId: string }>()
  const navigate = useNavigate()
  const base = `/empresa/${empresaId}`

  const { data: empleados, isLoading } = useQuery({
    queryKey: ["empleados", empresaId],
    queryFn: () => listEmpleados(empresaId!),
    enabled: !!empresaId,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Empleados</h1>
        <Button onClick={() => navigate(`${base}/empleados/nuevo`)}>
          <Plus className="size-4" />
          Nuevo Empleado
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !empleados || empleados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <Users className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No hay empleados aún</p>
                <p className="text-sm text-muted-foreground">
                  Agrega el primer empleado de esta empresa.
                </p>
              </div>
              <Button onClick={() => navigate(`${base}/empleados/nuevo`)}>
                <Plus className="size-4" />
                Nuevo Empleado
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Salario Base</TableHead>
                  <TableHead>Tipo Contrato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empleados.map((empleado) => (
                  <TableRow key={empleado.id}>
                    <TableCell className="font-medium">
                      {empleado.nombre} {empleado.apellido}
                    </TableCell>
                    <TableCell>{empleado.cedula}</TableCell>
                    <TableCell>{empleado.cargo}</TableCell>
                    <TableCell className="text-right">
                      {empleado.contrato
                        ? formatCOP(empleado.contrato.salario_base)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {empleado.contrato
                        ? TIPO_CONTRATO_LABEL[empleado.contrato.tipo]
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {empleado.activo ? (
                        <Badge className="bg-green-600 hover:bg-green-600">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`${base}/empleados/${empleado.id}/edit`)
                        }
                      >
                        Editar
                      </Button>
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
