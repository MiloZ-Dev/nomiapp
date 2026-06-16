import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  createEmpleado,
  getEmpleado,
  updateEmpleado,
  upsertContrato,
} from "@/api/empleados"
import type { ContratoPayload, EmpleadoPayload } from "@/types/empleado"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SALARIO_MINIMO = 1750905

const empleadoSchema = z
  .object({
    nombre: z.string().min(1, "Requerido"),
    apellido: z.string().min(1, "Requerido"),
    cedula: z
      .string()
      .min(1, "Requerida")
      .regex(/^[0-9]+$/, "Solo números"),
    email: z.string().email("Correo inválido"),
    telefono: z.string().optional(),
    cargo: z.string().min(1, "Requerido"),
    tipo: z.enum(["termino_fijo", "indefinido", "obra_labor"]),
    salario_base: z
      .number({ message: "Ingresa un salario" })
      .min(SALARIO_MINIMO, `Mínimo ${SALARIO_MINIMO.toLocaleString("es-CO")}`),
    fecha_inicio: z.string().min(1, "Requerida"),
    fecha_fin: z.string().optional(),
    eps: z.string().min(1, "Requerida"),
    afp: z.string().min(1, "Requerida"),
    arl: z.string().min(1, "Requerida"),
    caja_compensacion: z.string().min(1, "Requerida"),
  })
  .superRefine((val, ctx) => {
    if (val.tipo === "termino_fijo" && !val.fecha_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fecha_fin"],
        message: "Requerida para término fijo",
      })
    }
  })

type EmpleadoFormValues = z.infer<typeof empleadoSchema>

const defaultValues: EmpleadoFormValues = {
  nombre: "",
  apellido: "",
  cedula: "",
  email: "",
  telefono: "",
  cargo: "",
  tipo: "indefinido",
  salario_base: SALARIO_MINIMO,
  fecha_inicio: "",
  fecha_fin: "",
  eps: "",
  afp: "",
  arl: "",
  caja_compensacion: "",
}

export default function EmpleadoForm() {
  const { empresaId, empleadoId } = useParams<{
    empresaId: string
    empleadoId?: string
  }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = empleadoId !== undefined
  const listUrl = `/empresa/${empresaId}/empleados`

  const form = useForm<EmpleadoFormValues>({
    resolver: zodResolver(empleadoSchema),
    defaultValues,
  })

  const tipo = form.watch("tipo")

  const { data: empleado } = useQuery({
    queryKey: ["empleado", empresaId, empleadoId],
    queryFn: () => getEmpleado(empresaId!, empleadoId!),
    enabled: isEdit && !!empresaId,
  })

  // Populate the form when editing an existing employee.
  useEffect(() => {
    if (!empleado) return
    form.reset({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      cedula: empleado.cedula,
      email: empleado.email,
      telefono: empleado.telefono ?? "",
      cargo: empleado.cargo,
      tipo: empleado.contrato?.tipo ?? "indefinido",
      salario_base: empleado.contrato?.salario_base ?? SALARIO_MINIMO,
      fecha_inicio: empleado.contrato?.fecha_inicio ?? "",
      fecha_fin: empleado.contrato?.fecha_fin ?? "",
      eps: empleado.contrato?.eps ?? "",
      afp: empleado.contrato?.afp ?? "",
      arl: empleado.contrato?.arl ?? "",
      caja_compensacion: empleado.contrato?.caja_compensacion ?? "",
    })
  }, [empleado, form])

  const mutation = useMutation({
    mutationFn: async (values: EmpleadoFormValues) => {
      const personal: EmpleadoPayload = {
        nombre: values.nombre,
        apellido: values.apellido,
        cedula: values.cedula,
        email: values.email,
        telefono: values.telefono,
        cargo: values.cargo,
      }
      const contrato: ContratoPayload = {
        tipo: values.tipo,
        salario_base: values.salario_base,
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.tipo === "termino_fijo" ? values.fecha_fin : undefined,
        eps: values.eps,
        afp: values.afp,
        arl: values.arl,
        caja_compensacion: values.caja_compensacion,
      }

      if (isEdit) {
        await updateEmpleado(empresaId!, empleadoId!, personal)
        await upsertContrato(empresaId!, empleadoId!, contrato)
      } else {
        const nuevo = await createEmpleado(empresaId!, personal)
        await upsertContrato(empresaId!, nuevo.id, contrato)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados", empresaId] })
      toast.success(
        isEdit ? "Empleado actualizado" : "Empleado creado exitosamente"
      )
      navigate(listUrl)
    },
    onError: () => toast.error("No se pudo guardar el empleado"),
  })

  function onSubmit(values: EmpleadoFormValues) {
    mutation.mutate(values)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula *</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contrato</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de contrato *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="termino_fijo">Término Fijo</SelectItem>
                        <SelectItem value="indefinido">Indefinido</SelectItem>
                        <SelectItem value="obra_labor">Obra Labor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salario_base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salario base *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={SALARIO_MINIMO}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {tipo === "termino_fijo" && (
                <FormField
                  control={form.control}
                  name="fecha_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de fin *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="eps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPS *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="afp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AFP *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ARL *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caja_compensacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caja de compensación *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(listUrl)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
