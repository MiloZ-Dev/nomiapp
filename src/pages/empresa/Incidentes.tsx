import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createIncident,
  deleteIncident,
  getEmployee,
  listIncidents,
} from "@/api/employees"
import {
  DEDUCTION_INCIDENTS,
  INCIDENT_LABELS,
  INCOME_INCIDENTS,
  type Incident,
  type IncidentType,
} from "@/types/incident"
import { formatCOP } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const HOURS_TYPES: IncidentType[] = [
  "day_overtime",
  "night_overtime",
  "holiday_overtime",
  "unjustified_absence",
  "late_arrival",
]
const DAYS_TYPES: IncidentType[] = [
  "paid_vacation",
  "paid_sick_leave",
  "unjustified_absence",
]
const AMOUNT_TYPES: IncidentType[] = [
  "bonus",
  "commission",
  "special_allowance",
  "payroll_deduction",
  "garnishment",
  "payroll_advance",
  "other_deduction",
]

const isIncome = (type: IncidentType) => INCOME_INCIDENTS.includes(type)

const optionalNumber = z.number().positive("Debe ser mayor a 0").optional()

const incidentSchema = z
  .object({
    type: z.enum([
      "day_overtime",
      "night_overtime",
      "holiday_overtime",
      "bonus",
      "commission",
      "special_allowance",
      "paid_vacation",
      "paid_sick_leave",
      "unjustified_absence",
      "late_arrival",
      "payroll_deduction",
      "garnishment",
      "payroll_advance",
      "other_deduction",
    ]),
    date: z.string().min(1, "Requerida"),
    hours: optionalNumber,
    days: optionalNumber,
    amount: optionalNumber,
    description: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.hours === undefined &&
      val.days === undefined &&
      val.amount === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Ingresa al menos horas, días o valor",
      })
    }
  })

type IncidentValues = z.infer<typeof incidentSchema>

function CategoryBadge({ type }: { type: IncidentType }) {
  return isIncome(type) ? (
    <Badge className="bg-green-600 hover:bg-green-600">Ingreso</Badge>
  ) : (
    <Badge variant="destructive">Descuento</Badge>
  )
}

function IncidentRows({
  incidents,
  onDelete,
  showPayroll = false,
  showActions = false,
  base,
}: {
  incidents: Incident[]
  onDelete?: (id: string) => void
  showPayroll?: boolean
  showActions?: boolean
  base?: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Horas</TableHead>
          <TableHead className="text-right">Días</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Descripción</TableHead>
          {showPayroll && <TableHead>Nómina</TableHead>}
          {showActions && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents.map((inc) => (
          <TableRow key={inc.id}>
            <TableCell className="font-medium">
              {INCIDENT_LABELS[inc.type]}
            </TableCell>
            <TableCell>
              <CategoryBadge type={inc.type} />
            </TableCell>
            <TableCell>{inc.date}</TableCell>
            <TableCell className="text-right">{inc.hours ?? "—"}</TableCell>
            <TableCell className="text-right">{inc.days ?? "—"}</TableCell>
            <TableCell className="text-right">
              {inc.amount != null ? formatCOP(inc.amount) : "—"}
            </TableCell>
            <TableCell className="max-w-40 truncate">
              {inc.description ?? "—"}
            </TableCell>
            {showPayroll && (
              <TableCell>
                {inc.payroll_id ? (
                  <Link
                    to={`${base}/nomina`}
                    className="text-indigo-600 hover:underline"
                  >
                    Ver período
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
            )}
            {showActions && (
              <TableCell className="text-right">
                {!inc.applied && onDelete && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(inc.id)}
                    aria-label="Eliminar novedad"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Incidentes() {
  const { empresaId, empleadoId } = useParams<{
    empresaId: string
    empleadoId: string
  }>()
  const queryClient = useQueryClient()
  const base = `/empresa/${empresaId}`
  const [open, setOpen] = useState(false)
  const [showApplied, setShowApplied] = useState(false)

  const { data: employee } = useQuery({
    queryKey: ["employee", empresaId, empleadoId],
    queryFn: () => getEmployee(empresaId!, empleadoId!),
    enabled: !!empresaId && !!empleadoId,
  })

  const { data: pending } = useQuery({
    queryKey: ["incidents", empresaId, empleadoId, "pending"],
    queryFn: () => listIncidents(empresaId!, empleadoId!, false),
    enabled: !!empresaId && !!empleadoId,
  })

  const { data: applied } = useQuery({
    queryKey: ["incidents", empresaId, empleadoId, "applied"],
    queryFn: () => listIncidents(empresaId!, empleadoId!, true),
    enabled: !!empresaId && !!empleadoId && showApplied,
  })

  const form = useForm<IncidentValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      type: "day_overtime",
      date: "",
      hours: undefined,
      days: undefined,
      amount: undefined,
      description: "",
    },
  })

  const type = form.watch("type")

  const createMutation = useMutation({
    mutationFn: (values: IncidentValues) =>
      createIncident(empresaId!, empleadoId!, {
        type: values.type,
        date: values.date,
        hours: HOURS_TYPES.includes(values.type) ? values.hours : undefined,
        days: DAYS_TYPES.includes(values.type) ? values.days : undefined,
        amount: AMOUNT_TYPES.includes(values.type) ? values.amount : undefined,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incidents", empresaId, empleadoId, "pending"],
      })
      setOpen(false)
      form.reset()
      toast.success("Novedad registrada")
    },
    onError: () => toast.error("No se pudo registrar la novedad"),
  })

  const deleteMutation = useMutation({
    mutationFn: (incidentId: string) =>
      deleteIncident(empresaId!, empleadoId!, incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incidents", empresaId, empleadoId, "pending"],
      })
      toast.success("Novedad eliminada")
    },
    onError: () => toast.error("No se pudo eliminar la novedad"),
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`${base}/empleados`}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a empleados
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Novedades de {employee?.first_name} {employee?.last_name}
        </h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nueva Novedad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Novedad</DialogTitle>
              <DialogDescription>
                Registra una novedad para el período de nómina.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                id="incident-form"
                onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Ingresos</SelectLabel>
                            {INCOME_INCIDENTS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {INCIDENT_LABELS[t]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Descuentos</SelectLabel>
                            {DEDUCTION_INCIDENTS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {INCIDENT_LABELS[t]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {HOURS_TYPES.includes(type) && (
                  <NumberField form={form} name="hours" label="Horas" />
                )}
                {DAYS_TYPES.includes(type) && (
                  <NumberField form={form} name="days" label="Días" />
                )}
                {AMOUNT_TYPES.includes(type) && (
                  <NumberField form={form} name="amount" label="Valor" />
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button
                type="submit"
                form="incident-form"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novedades pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          {!pending || pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay novedades pendientes.
            </p>
          ) : (
            <IncidentRows
              incidents={pending}
              onDelete={(id) => deleteMutation.mutate(id)}
              showActions
            />
          )}
        </CardContent>
      </Card>

      {/* Aplicadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Novedades aplicadas</CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="show-applied"
              checked={showApplied}
              onCheckedChange={setShowApplied}
            />
            <Label htmlFor="show-applied" className="text-sm">
              Mostrar
            </Label>
          </div>
        </CardHeader>
        {showApplied && (
          <CardContent>
            {!applied || applied.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay novedades aplicadas.
              </p>
            ) : (
              <IncidentRows incidents={applied} showPayroll base={base} />
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function NumberField({
  form,
  name,
  label,
}: {
  form: ReturnType<typeof useForm<IncidentValues>>
  name: "hours" | "days" | "amount"
  label: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={
                field.value === undefined || Number.isNaN(field.value)
                  ? ""
                  : (field.value as number)
              }
              onChange={(e) => {
                const n = e.target.valueAsNumber
                field.onChange(Number.isNaN(n) ? undefined : n)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
