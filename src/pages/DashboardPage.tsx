import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Copy, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { AppLayout } from "@/components/layout/AppLayout"
import { createEmpresa, listEmpresas } from "@/api/empresas"
import type { Empresa, EmpresaCredenciales } from "@/types/empresa"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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

const empresaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  nit: z
    .string()
    .min(1, "El NIT es requerido")
    .regex(/^[0-9-]+$/, "El NIT solo admite números y guión"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
})

type EmpresaValues = z.infer<typeof empresaSchema>

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [credenciales, setCredenciales] = useState<EmpresaCredenciales | null>(
    null
  )

  const { data: empresas, isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: listEmpresas,
  })

  const form = useForm<EmpresaValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { nombre: "", nit: "", ciudad: "", direccion: "", telefono: "" },
  })

  const createMutation = useMutation({
    mutationFn: createEmpresa,
    onSuccess: (result) => {
      // Close the form dialog and surface the one-time credentials instead.
      setOpen(false)
      form.reset()
      setCredenciales(result.credenciales)
    },
    onError: () => toast.error("No se pudo crear la empresa"),
  })

  function onSubmit(values: EmpresaValues) {
    createMutation.mutate(values)
  }

  // Refresh the list only once the admin has dismissed the credentials dialog.
  function closeCredenciales() {
    setCredenciales(null)
    queryClient.invalidateQueries({ queryKey: ["empresas"] })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Mis Empresas
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra las empresas de tu cuenta
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Nueva Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Empresa</DialogTitle>
                <DialogDescription>
                  Completa los datos de la empresa.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  id="empresa-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme S.A.S" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIT *</FormLabel>
                        <FormControl>
                          <Input placeholder="900123456-7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ciudad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bogotá" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle 123 #45-67" {...field} />
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
                          <Input placeholder="6011234567" {...field} />
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
                  form="empresa-form"
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

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : !empresas || empresas.length === 0 ? (
          <EmptyState onCreate={() => setOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((empresa) => (
              <EmpresaCard
                key={empresa.id}
                empresa={empresa}
                onClick={() => navigate(`/empresa/${empresa.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Credenciales de acceso (una sola vez) */}
      <Dialog
        open={!!credenciales}
        onOpenChange={(o) => !o && closeCredenciales()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empresa creada exitosamente</DialogTitle>
            <DialogDescription>
              Guarda estas credenciales. La contraseña no se volverá a mostrar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <CredencialField label="Email" value={credenciales?.email ?? ""} />
            <CredencialField
              label="Contraseña"
              value={credenciales?.password ?? ""}
            />
            <Badge className="w-full justify-start whitespace-normal bg-yellow-500 py-2 text-yellow-950 hover:bg-yellow-500">
              ⚠️ Copia la contraseña ahora, no se mostrará de nuevo
            </Badge>
          </div>

          <DialogFooter>
            <Button onClick={closeCredenciales}>
              Entendido, ya copié las credenciales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

function CredencialField({ label, value }: { label: string; value: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copiado`)
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="font-mono" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copy}
          aria-label={`Copiar ${label}`}
        >
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function EmpresaCard({
  empresa,
  onClick,
}: {
  empresa: Empresa
  onClick: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{empresa.nombre}</CardTitle>
          {empresa.activo ? (
            <Badge className="bg-green-600 hover:bg-green-600">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>NIT: {empresa.nit}</p>
        <p>{empresa.ciudad}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <Building2 className="size-10 text-muted-foreground" />
      <div>
        <p className="font-medium">No tienes empresas aún</p>
        <p className="text-sm text-muted-foreground">
          Crea tu primera empresa para comenzar.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="size-4" />
        Nueva Empresa
      </Button>
    </div>
  )
}
