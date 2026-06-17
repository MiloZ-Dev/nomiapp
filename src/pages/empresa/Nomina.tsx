import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/axios"
import {
  closePayroll,
  generatePayroll,
  getPayroll,
  listPayrolls,
} from "@/api/payroll"
import type { Payroll, PayrollStatus } from "@/types/payroll"
import { downloadPDF, formatCOP } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

async function handleDownload(url: string, filename: string) {
  try {
    await downloadPDF(url, filename)
  } catch {
    toast.error("No se pudo descargar el PDF")
  }
}

function StatusBadge({ status }: { status: PayrollStatus }) {
  if (status === "closed") {
    return <Badge className="bg-green-600 hover:bg-green-600">Cerrada</Badge>
  }
  return (
    <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
      Borrador
    </Badge>
  )
}

// Muestra "—" cuando el valor es 0 para no saturar la tabla.
// Los montos pueden llegar como strings desde el backend; se parsean con Number().
const fmtOpt = (val: number | string) =>
  Number(val) > 0 ? formatCOP(Number(val)) : "—"

function DetailTable({
  payroll,
  empresaId,
  withDesprendible = false,
}: {
  payroll: Payroll
  empresaId?: string
  withDesprendible?: boolean
}) {
  const details = payroll.details ?? []
  const totalEarned = details.reduce((s, d) => s + Number(d.total_earned), 0)
  const totalDeductions = details.reduce(
    (s, d) => s + Number(d.total_deductions),
    0
  )
  const totalNet = details.reduce((s, d) => s + Number(d.net_pay), 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empleado</TableHead>
          <TableHead className="text-right">Salario Base</TableHead>
          <TableHead className="text-right">Aux. Transp.</TableHead>
          <TableHead className="text-right">H. Extra</TableHead>
          <TableHead className="text-right">Bonif.</TableHead>
          <TableHead className="text-right">Desc. Adic.</TableHead>
          <TableHead className="text-right">Devengado</TableHead>
          <TableHead className="text-right">Deducciones</TableHead>
          <TableHead className="text-right font-bold">Neto</TableHead>
          {withDesprendible && (
            <TableHead className="text-right">Acciones</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {details.map((d) => (
          <TableRow key={d.id ?? d.employee_id}>
            <TableCell>{d.employee_name}</TableCell>
            <TableCell className="text-right">
              {formatCOP(Number(d.base_salary))}
            </TableCell>
            <TableCell className="text-right">
              {fmtOpt(d.transport_allowance)}
            </TableCell>
            <TableCell className="text-right">
              {fmtOpt(d.overtime_value)}
            </TableCell>
            <TableCell className="text-right">
              {fmtOpt(d.total_bonuses)}
            </TableCell>
            <TableCell className="text-right">
              {fmtOpt(d.total_additional_deductions)}
            </TableCell>
            <TableCell className="text-right">
              {formatCOP(Number(d.total_earned))}
            </TableCell>
            <TableCell className="text-right">
              {formatCOP(Number(d.total_deductions))}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCOP(Number(d.net_pay))}
            </TableCell>
            {withDesprendible && (
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownload(
                      `${api.defaults.baseURL}/empresas/${empresaId}/nomina/${payroll.id}/empleados/${d.employee_id}/desprendible`,
                      `desprendible-${d.employee_name.replace(/\s+/g, "_")}.pdf`
                    )
                  }
                >
                  Desprendible
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
        {details.length > 0 && (
          <TableRow className="bg-gray-50 font-bold border-t-2">
            <TableCell>TOTALES</TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell className="text-right font-bold">
              {formatCOP(totalEarned)}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCOP(totalDeductions)}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCOP(totalNet)}
            </TableCell>
            {withDesprendible && <TableCell />}
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default function Nomina() {
  const { empresaId } = useParams<{ empresaId: string }>()
  const queryClient = useQueryClient()

  const [periodoInicio, setPeriodoInicio] = useState("")
  const [periodoFin, setPeriodoFin] = useState("")

  const [preview, setPreview] = useState<Payroll | null>(null)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [cerrarTarget, setCerrarTarget] = useState<Payroll | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ["payrolls", empresaId],
    queryFn: () => listPayrolls(empresaId!),
    enabled: !!empresaId,
  })

  const { data: detalle } = useQuery({
    queryKey: ["payroll", empresaId, detalleId],
    queryFn: () => getPayroll(empresaId!, detalleId!),
    enabled: !!empresaId && !!detalleId,
  })

  const generarMutation = useMutation({
    mutationFn: () =>
      generatePayroll(empresaId!, {
        period_start: periodoInicio,
        period_end: periodoFin,
      }),
    onSuccess: (payroll) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", empresaId] })
      setPreview(payroll)
    },
    onError: () => toast.error("No se pudo generar la nómina"),
  })

  const cerrarMutation = useMutation({
    mutationFn: (payrollId: string) => closePayroll(empresaId!, payrollId),
    onSuccess: ({ warnings }) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", empresaId] })
      setCerrarTarget(null)
      setWarnings(warnings)
      toast.success("Nómina cerrada")
    },
    onError: () => toast.error("No se pudo cerrar la nómina"),
  })

  function onGenerar() {
    if (!periodoInicio || !periodoFin) {
      toast.error("Selecciona el período de inicio y fin")
      return
    }
    generarMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nómina</h1>

      {/* Generar nómina */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generar Nómina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="periodo-inicio">Período Inicio</Label>
              <Input
                id="periodo-inicio"
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periodo-fin">Período Fin</Label>
              <Input
                id="periodo-fin"
                type="date"
                value={periodoFin}
                onChange={(e) => setPeriodoFin(e.target.value)}
              />
            </div>
            <Button onClick={onGenerar} disabled={generarMutation.isPending}>
              {generarMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Generar Nómina
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Nóminas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          ) : !payrolls || payrolls.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay nóminas registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Total Devengado</TableHead>
                  <TableHead className="text-right">Total Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCOP(p.total_earned)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCOP(p.total_net)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetalleId(p.id)}
                        >
                          Ver detalle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(
                              `${api.defaults.baseURL}/empresas/${empresaId}/nomina/${p.id}/pdf`,
                              `nomina-${p.period_start}_${p.period_end}.pdf`
                            )
                          }
                        >
                          <FileText className="size-4" />
                          Nómina PDF
                        </Button>
                        {p.status === "draft" && (
                          <Button size="sm" onClick={() => setCerrarTarget(p)}>
                            Cerrar Nómina
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Advertencias al cerrar nómina */}
      {warnings.length > 0 && (
        <Alert variant="warning" className="mt-4">
          <AlertTriangle />
          <AlertTitle>Advertencias al cerrar nómina</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview tras generar */}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent
          className="max-h-[90vh] overflow-auto"
          style={{ maxWidth: "95vw", width: "95vw" }}
        >
          <DialogHeader>
            <DialogTitle>Vista previa de la nómina</DialogTitle>
            <DialogDescription>
              {preview &&
                `${fmtDate(preview.period_start)} – ${fmtDate(
                  preview.period_end
                )} · ${preview.details?.length ?? 0} empleados`}
            </DialogDescription>
          </DialogHeader>
          {preview && <DetailTable payroll={preview} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Cerrar sin guardar
            </Button>
            <Button onClick={() => setPreview(null)}>Confirmar y Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalle de una nómina existente */}
      <Dialog
        open={!!detalleId}
        onOpenChange={(open) => !open && setDetalleId(null)}
      >
        <DialogContent
          className="max-h-[90vh] overflow-auto"
          style={{ maxWidth: "95vw", width: "95vw" }}
        >
          <DialogHeader>
            <DialogTitle>Detalle de la nómina</DialogTitle>
            <DialogDescription>
              {detalle &&
                `${fmtDate(detalle.period_start)} – ${fmtDate(
                  detalle.period_end
                )}`}
            </DialogDescription>
          </DialogHeader>
          {detalle ? (
            <DetailTable
              payroll={detalle}
              empresaId={empresaId}
              withDesprendible
            />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar cierre */}
      <Dialog
        open={!!cerrarTarget}
        onOpenChange={(open) => !open && setCerrarTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar nómina</DialogTitle>
            <DialogDescription>
              {cerrarTarget &&
                `¿Confirmas cerrar la nómina del período ${fmtDate(
                  cerrarTarget.period_start
                )} – ${fmtDate(
                  cerrarTarget.period_end
                )}? Esta acción no se puede deshacer.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCerrarTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                cerrarTarget && cerrarMutation.mutate(cerrarTarget.id)
              }
              disabled={cerrarMutation.isPending}
            >
              {cerrarMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Cerrar Nómina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
