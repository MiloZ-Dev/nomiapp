import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Bell, Plus, Users } from "lucide-react"

import { listEmployees } from "@/api/employees"
import { CONTRACT_TYPE_LABELS, formatCOP } from "@/lib/utils"
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

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", empresaId],
    queryFn: () => listEmployees(empresaId!),
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
          ) : !employees || employees.length === 0 ? (
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
                  <TableHead>Documento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Salario Base</TableHead>
                  <TableHead>Tipo Contrato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.id_number}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-right">
                      {employee.contract
                        ? formatCOP(employee.contract.base_salary)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {employee.contract
                        ? CONTRACT_TYPE_LABELS[employee.contract.type] ??
                          employee.contract.type
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {employee.active ? (
                        <Badge className="bg-green-600 hover:bg-green-600">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `${base}/empleados/${employee.id}/novedades`
                            )
                          }
                        >
                          <Bell className="size-4" />
                          Novedades
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`${base}/empleados/${employee.id}/edit`)
                          }
                        >
                          Editar
                        </Button>
                      </div>
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
