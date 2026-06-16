import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/axios"
import {
  cerrarNomina,
  generarNomina,
  getNomina,
  listNominas,
} from "@/api/nomina"
import type { Nomina as NominaModel } from "@/types/nomina"
import { downloadPDF, formatCOP } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

function EstadoBadge({ estado }: { estado: NominaModel["estado"] }) {
  if (estado === "cerrada") {
    return <Badge className="bg-green-600 hover:bg-green-600">Cerrada</Badge>
  }
  return (
    <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
      Borrador
    </Badge>
  )
}

function DetalleTable({
  nomina,
  empresaId,
  withDesprendible = false,
}: {
  nomina: NominaModel
  empresaId?: string
  withDesprendible?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empleado</TableHead>
          <TableHead className="text-right">Devengado</TableHead>
          <TableHead className="text-right">Deducciones</TableHead>
          <TableHead className="text-right">Neto</TableHead>
          {withDesprendible && (
            <TableHead className="text-right">Acciones</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {(nomina.detalles ?? []).map((d) => (
          <TableRow key={d.id ?? d.empleado_id}>
            <TableCell>{d.empleado_nombre}</TableCell>
            <TableCell className="text-right">
              {formatCOP(d.total_devengado)}
            </TableCell>
            <TableCell className="text-right">
              {formatCOP(d.total_deducciones)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCOP(d.neto)}
            </TableCell>
            {withDesprendible && (
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownload(
                      `${api.defaults.baseURL}/empresas/${empresaId}/nomina/${nomina.id}/empleados/${d.empleado_id}/desprendible`,
                      `desprendible-${d.empleado_nombre.replace(/\s+/g, "_")}.pdf`
                    )
                  }
                >
                  Desprendible
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Nomina() {
  const { empresaId } = useParams<{ empresaId: string }>()
  const queryClient = useQueryClient()

  const [periodoInicio, setPeriodoInicio] = useState("")
  const [periodoFin, setPeriodoFin] = useState("")

  const [preview, setPreview] = useState<NominaModel | null>(null)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [cerrarTarget, setCerrarTarget] = useState<NominaModel | null>(null)

  const { data: nominas, isLoading } = useQuery({
    queryKey: ["nominas", empresaId],
    queryFn: () => listNominas(empresaId!),
    enabled: !!empresaId,
  })

  const { data: detalle } = useQuery({
    queryKey: ["nomina", empresaId, detalleId],
    queryFn: () => getNomina(empresaId!, detalleId!),
    enabled: !!empresaId && !!detalleId,
  })

  const generarMutation = useMutation({
    mutationFn: () =>
      generarNomina(empresaId!, {
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
      }),
    onSuccess: (nomina) => {
      queryClient.invalidateQueries({ queryKey: ["nominas", empresaId] })
      setPreview(nomina)
    },
    onError: () => toast.error("No se pudo generar la nómina"),
  })

  const cerrarMutation = useMutation({
    mutationFn: (nominaId: string) => cerrarNomina(empresaId!, nominaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nominas", empresaId] })
      setCerrarTarget(null)
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
          ) : !nominas || nominas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay nóminas registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Empleados</TableHead>
                  <TableHead className="text-right">Total Devengado</TableHead>
                  <TableHead className="text-right">Total Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominas.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      {fmtDate(n.periodo_inicio)} – {fmtDate(n.periodo_fin)}
                    </TableCell>
                    <TableCell className="text-right">
                      {n.empleados_procesados}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCOP(n.total_devengado)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCOP(n.total_neto)}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={n.estado} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetalleId(n.id)}
                        >
                          Ver detalle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(
                              `${api.defaults.baseURL}/empresas/${empresaId}/nomina/${n.id}/pdf`,
                              `nomina-${n.periodo_inicio}_${n.periodo_fin}.pdf`
                            )
                          }
                        >
                          <FileText className="size-4" />
                          Nómina PDF
                        </Button>
                        {n.estado === "borrador" && (
                          <Button
                            size="sm"
                            onClick={() => setCerrarTarget(n)}
                          >
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

      {/* Preview tras generar */}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista previa de la nómina</DialogTitle>
            <DialogDescription>
              {preview &&
                `${fmtDate(preview.periodo_inicio)} – ${fmtDate(
                  preview.periodo_fin
                )} · ${preview.empleados_procesados} empleados`}
            </DialogDescription>
          </DialogHeader>
          {preview && <DetalleTable nomina={preview} />}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de la nómina</DialogTitle>
            <DialogDescription>
              {detalle &&
                `${fmtDate(detalle.periodo_inicio)} – ${fmtDate(
                  detalle.periodo_fin
                )}`}
            </DialogDescription>
          </DialogHeader>
          {detalle ? (
            <DetalleTable
              nomina={detalle}
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
                  cerrarTarget.periodo_inicio
                )} – ${fmtDate(
                  cerrarTarget.periodo_fin
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
