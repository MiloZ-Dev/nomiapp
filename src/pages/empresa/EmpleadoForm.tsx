import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText, Loader2, Lock, Plus, Sparkles, Upload, X } from "lucide-react"
import { toast } from "sonner"

import {
  createEmployee,
  extractContractData,
  getEmployee,
  updateEmployee,
  upsertContract,
} from "@/api/employees"
import type { ContractCreate, EmployeeCreate } from "@/types/employee"
import { formatCOP } from "@/lib/utils"
import { COLOMBIA_DEPARTMENTS } from "@/data/colombia"
import { COLOMBIA_BANKS } from "@/data/banks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SALARIO_MINIMO = 1750905
const SMMLV_2026 = 1750905
const AUXILIO_TRANSPORTE = 249095

const optionalNumber = z.number().optional()

const employeeSchema = z
  .object({
    // Personal
    first_name: z.string().min(1, "Requerido"),
    middle_name: z.string().optional(),
    last_name: z.string().min(1, "Requerido"),
    second_last_name: z.string().optional(),
    document_type: z.string().optional(),
    id_number: z.string().min(1, "Requerido").regex(/^[0-9]+$/, "Solo números"),
    birth_date: z.string().optional(),
    gender: z.string().optional(),
    marital_status: z.string().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    department: z.string().optional(),
    phone: z.string().optional(),
    email: z.union([z.literal(""), z.string().email("Correo inválido")]).optional(),
    // Laboral
    position: z.string().min(1, "Requerido"),
    area: z.string().optional(),
    hire_date: z.string().min(1, "Requerida"),
    payment_frequency: z.enum(["weekly", "biweekly", "monthly"]),
    // Contrato
    type: z.enum(["fixed_term", "indefinite", "work_contract"]),
    base_salary: z
      .number({ message: "Ingresa un salario" })
      .min(SALARIO_MINIMO, `Mínimo ${SALARIO_MINIMO.toLocaleString("es-CO")}`),
    end_date: z.string().optional(),
    eps: z.string().min(1, "Requerida"),
    afp: z.string().min(1, "Requerida"),
    arl: z.string().min(1, "Requerida"),
    compensation_fund: z.string().min(1, "Requerida"),
    work_schedule: z.string().optional(),
    weekly_hours: optionalNumber,
    modality: z.string().optional(),
    work_location: z.string().optional(),
    probation_period: z.boolean(),
    probation_days: optionalNumber,
    mobility_allowance: optionalNumber,
    food_allowance: optionalNumber,
    // Bancaria
    bank: z.string().optional(),
    account_type: z.string().optional(),
    account_number: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "fixed_term" && !val.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "Requerida para término fijo",
      })
    }
  })

type EmployeeFormValues = z.infer<typeof employeeSchema>

// Mapeo de cada tab con los campos requeridos que contiene, para poder
// detectar a qué tab pertenece el primer error al intentar guardar.
type TabKey = "personal" | "laboral" | "contrato" | "bancaria"

const TAB_FIELDS: Record<TabKey, (keyof EmployeeFormValues)[]> = {
  personal: ["first_name", "last_name", "id_number"],
  laboral: ["position", "hire_date"],
  contrato: ["type", "base_salary", "end_date", "eps", "afp", "arl", "compensation_fund"],
  bancaria: [],
}

const TAB_LABELS: Record<TabKey, string> = {
  personal: "Información Personal",
  laboral: "Información Laboral",
  contrato: "Contrato",
  bancaria: "Información Bancaria",
}

const TAB_ORDER: TabKey[] = ["personal", "laboral", "contrato", "bancaria"]

interface OtherAllowance {
  name: string
  amount: number
}

const defaultValues: EmployeeFormValues = {
  first_name: "",
  middle_name: "",
  last_name: "",
  second_last_name: "",
  document_type: "CC",
  id_number: "",
  birth_date: "",
  gender: "",
  marital_status: "",
  nationality: "Colombiana",
  address: "",
  city: "",
  department: "",
  phone: "",
  email: "",
  position: "",
  area: "",
  hire_date: "",
  payment_frequency: "monthly",
  type: "indefinite",
  base_salary: SALARIO_MINIMO,
  end_date: "",
  eps: "",
  afp: "",
  arl: "",
  compensation_fund: "",
  work_schedule: "Completa",
  weekly_hours: 48,
  modality: "Presencial",
  work_location: "",
  probation_period: false,
  probation_days: undefined,
  mobility_allowance: undefined,
  food_allowance: undefined,
  bank: "",
  account_type: "",
  account_number: "",
}

const orUndef = (v?: string) => (v && v.trim() !== "" ? v : undefined)

// Los montos del contrato pueden llegar como strings con formato "234200,00".
// Truncamos la parte decimal con parseInt para eliminarla por completo.
const parseNum = (val: unknown): number | undefined => {
  if (val === null || val === undefined) return undefined
  const num = parseInt(String(val).replace(",", "."), 10)
  return isNaN(num) ? undefined : num
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

  const [activeTab, setActiveTab] = useState<TabKey>("personal")
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const contractInputRef = useRef<HTMLInputElement>(null)

  // Otros auxilios: lista dinámica con nombre + monto.
  const [otherAllowances, setOtherAllowances] = useState<OtherAllowance[]>([])
  const [allowanceDialogOpen, setAllowanceDialogOpen] = useState(false)
  const [allowanceName, setAllowanceName] = useState("")
  const [allowanceAmount, setAllowanceAmount] = useState("")

  const otherAllowancesTotal = useMemo(
    () => otherAllowances.reduce((sum, a) => sum + a.amount, 0),
    [otherAllowances]
  )

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
    mode: "onChange",
  })

  const type = form.watch("type")
  const probationPeriod = form.watch("probation_period")
  const department = form.watch("department")
  const salary = form.watch("base_salary")

  // Ciudades disponibles según el departamento seleccionado.
  const cities = useMemo(
    () => COLOMBIA_DEPARTMENTS.find((d) => d.name === department)?.cities ?? [],
    [department]
  )

  // Auxilio de transporte: aplica si el salario es menor o igual a 2 SMMLV.
  const appliesTransport = !!salary && salary <= SMMLV_2026 * 2

  const banks = useMemo(() => [...COLOMBIA_BANKS].sort((a, b) => a.localeCompare(b)), [])

  const { data: employee } = useQuery({
    queryKey: ["employee", empresaId, empleadoId],
    queryFn: () => getEmployee(empresaId!, empleadoId!),
    enabled: isEdit && !!empresaId,
  })

  // Populate the form when editing an existing employee.
  useEffect(() => {
    if (!employee) return
    const c = employee.contract
    form.reset({
      first_name: employee.first_name,
      middle_name: employee.middle_name ?? "",
      last_name: employee.last_name,
      second_last_name: employee.second_last_name ?? "",
      document_type: employee.document_type ?? "CC",
      id_number: employee.id_number,
      birth_date: employee.birth_date ?? "",
      gender: employee.gender ?? "",
      marital_status: employee.marital_status ?? "",
      nationality: employee.nationality ?? "Colombiana",
      address: employee.address ?? "",
      city: employee.city ?? "",
      department: employee.department ?? "",
      phone: employee.phone ?? "",
      email: employee.email ?? "",
      position: employee.position,
      area: employee.area ?? "",
      hire_date: employee.hire_date ?? c?.start_date ?? "",
      payment_frequency: employee.payment_frequency ?? "monthly",
      type: c?.type ?? "indefinite",
      base_salary: parseNum(c?.base_salary) ?? SALARIO_MINIMO,
      end_date: c?.end_date ?? "",
      eps: c?.eps ?? "",
      afp: c?.afp ?? "",
      arl: c?.arl ?? "",
      compensation_fund: c?.compensation_fund ?? "",
      work_schedule: c?.work_schedule ?? "Completa",
      weekly_hours: parseNum(c?.weekly_hours) ?? 48,
      modality: c?.modality ?? "Presencial",
      work_location: c?.work_location ?? "",
      probation_period: c?.probation_period ?? false,
      probation_days: c?.probation_days ?? undefined,
      mobility_allowance: parseNum(c?.mobility_allowance),
      food_allowance: parseNum(c?.food_allowance),
      bank: employee.bank ?? "",
      account_type: employee.account_type ?? "",
      account_number: employee.account_number ?? "",
    })
    // No podemos descomponer el monto en auxilios con nombre; sembramos uno.
    if (c?.other_allowances && c.other_allowances > 0) {
      setOtherAllowances([{ name: "Otros auxilios", amount: c.other_allowances }])
    }
  }, [employee, form])

  async function onExtract() {
    if (!contractFile) {
      toast.error("Selecciona primero un PDF del contrato")
      return
    }
    setExtracting(true)
    try {
      const { ai_disponible, datos } = await extractContractData(
        empresaId!,
        contractFile
      )
      if (!ai_disponible) {
        toast.warning("La extracción con AI no está disponible")
        return
      }
      // Pre-fill the form with whatever fields the AI returned.
      Object.entries(datos).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return
        // start_date del contrato se mapea a la fecha de ingreso.
        if (key === "start_date") {
          if (!datos.hire_date) {
            form.setValue("hire_date", value as string, { shouldDirty: true })
          }
          return
        }
        if (key === "other_allowances") return
        form.setValue(key as keyof EmployeeFormValues, value as never, {
          shouldDirty: true,
        })
      })
      toast.success("Datos extraídos, revisa el formulario")
    } catch {
      toast.error("No se pudo extraer la información del contrato")
    } finally {
      setExtracting(false)
    }
  }

  function addAllowance() {
    const amount = Number(allowanceAmount)
    if (!allowanceName.trim()) {
      toast.error("Ingresa el nombre del auxilio")
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Ingresa un monto positivo")
      return
    }
    setOtherAllowances((prev) => [...prev, { name: allowanceName.trim(), amount }])
    setAllowanceName("")
    setAllowanceAmount("")
    setAllowanceDialogOpen(false)
  }

  function removeAllowance(index: number) {
    setOtherAllowances((prev) => prev.filter((_, i) => i !== index))
  }

  const mutation = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      const personal: EmployeeCreate = {
        first_name: values.first_name,
        last_name: values.last_name,
        middle_name: orUndef(values.middle_name),
        second_last_name: orUndef(values.second_last_name),
        id_number: values.id_number,
        document_type: orUndef(values.document_type),
        birth_date: orUndef(values.birth_date),
        gender: orUndef(values.gender),
        marital_status: orUndef(values.marital_status),
        nationality: orUndef(values.nationality),
        address: orUndef(values.address),
        city: orUndef(values.city),
        department: orUndef(values.department),
        phone: orUndef(values.phone),
        email: orUndef(values.email),
        bank: orUndef(values.bank),
        account_type: orUndef(values.account_type),
        account_number: orUndef(values.account_number),
        position: values.position,
        area: orUndef(values.area),
        payment_frequency: values.payment_frequency,
        hire_date: orUndef(values.hire_date),
      }
      const contract: ContractCreate = {
        type: values.type,
        base_salary: values.base_salary,
        // La fecha de inicio del contrato es la fecha de ingreso (tab Laboral).
        start_date: values.hire_date,
        end_date: values.type === "fixed_term" ? values.end_date : undefined,
        eps: values.eps,
        afp: values.afp,
        arl: values.arl,
        compensation_fund: values.compensation_fund,
        probation_period: values.probation_period,
        probation_days: values.probation_period ? values.probation_days : undefined,
        work_schedule: orUndef(values.work_schedule),
        weekly_hours: values.weekly_hours,
        work_location: orUndef(values.work_location),
        modality: orUndef(values.modality),
        mobility_allowance: values.mobility_allowance,
        food_allowance: values.food_allowance,
        other_allowances: otherAllowancesTotal,
      }

      if (isEdit) {
        await updateEmployee(empresaId!, empleadoId!, personal)
        await upsertContract(empresaId!, empleadoId!, contract)
      } else {
        const created = await createEmployee(empresaId!, personal)
        await upsertContract(empresaId!, created.id, contract)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", empresaId] })
      toast.success(isEdit ? "Empleado actualizado" : "Empleado creado")
      navigate(listUrl)
    },
    onError: () => toast.error("No se pudo guardar el empleado"),
  })

  function onSubmit(values: EmployeeFormValues) {
    mutation.mutate(values)
  }

  // Al intentar guardar con errores: ubicar el tab del primer error,
  // cambiar a él y enfocar el campo.
  function onInvalid(errors: Record<string, unknown>) {
    for (const tab of TAB_ORDER) {
      const errField = TAB_FIELDS[tab].find((f) => errors[f])
      if (errField) {
        setActiveTab(tab)
        toast.error(`Revisa "${TAB_LABELS[tab]}": faltan campos requeridos`)
        setTimeout(() => form.setFocus(errField), 60)
        return
      }
    }
  }

  const isValid = form.formState.isValid

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
      </h1>

      {!isEdit && (
        <Alert>
          <FileText />
          <AlertTitle>Carga rápida con inteligencia artificial</AlertTitle>
          <AlertDescription>
            Sube el PDF del contrato (en el tab Contrato) para pre-llenar
            automáticamente los campos con inteligencia artificial. Si no tienes
            el PDF, completa los campos manualmente.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
            <TabsList>
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="laboral">Información Laboral</TabsTrigger>
              <TabsTrigger value="contrato">Contrato</TabsTrigger>
              <TabsTrigger value="bancaria">Información Bancaria</TabsTrigger>
            </TabsList>

            {/* TAB 1: Personal */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <TextField form={form} name="first_name" label="Nombre *" />
                  <TextField
                    form={form}
                    name="middle_name"
                    label="Segundo nombre"
                  />
                  <TextField form={form} name="last_name" label="Apellido *" />
                  <TextField
                    form={form}
                    name="second_last_name"
                    label="Segundo apellido"
                  />
                  <SelectField
                    form={form}
                    name="document_type"
                    label="Tipo de documento"
                    options={[
                      { value: "CC", label: "CC" },
                      { value: "CE", label: "CE" },
                      { value: "PA", label: "PA" },
                      { value: "TI", label: "TI" },
                    ]}
                  />
                  <TextField
                    form={form}
                    name="id_number"
                    label="Número de documento *"
                    inputMode="numeric"
                  />
                  <TextField
                    form={form}
                    name="birth_date"
                    label="Fecha de nacimiento"
                    type="date"
                  />
                  <SelectField
                    form={form}
                    name="gender"
                    label="Género"
                    placeholder="Selecciona"
                    options={[
                      { value: "M", label: "Masculino" },
                      { value: "F", label: "Femenino" },
                      { value: "Otro", label: "Otro" },
                    ]}
                  />
                  <SelectField
                    form={form}
                    name="marital_status"
                    label="Estado civil"
                    placeholder="Selecciona"
                    options={[
                      { value: "Soltero", label: "Soltero" },
                      { value: "Casado", label: "Casado" },
                      { value: "Unión libre", label: "Unión libre" },
                      { value: "Divorciado", label: "Divorciado" },
                      { value: "Viudo", label: "Viudo" },
                    ]}
                  />
                  <TextField
                    form={form}
                    name="nationality"
                    label="Nacionalidad"
                  />
                  <TextField form={form} name="address" label="Dirección" />
                  <SelectField
                    form={form}
                    name="department"
                    label="Departamento"
                    placeholder="Selecciona departamento"
                    options={COLOMBIA_DEPARTMENTS.map((d) => ({
                      value: d.name,
                      label: d.name,
                    }))}
                    onChange={() => form.setValue("city", "")}
                  />
                  <SelectField
                    form={form}
                    name="city"
                    label="Ciudad"
                    placeholder={
                      department
                        ? "Selecciona ciudad"
                        : "Selecciona departamento primero"
                    }
                    disabled={!department}
                    options={cities.map((c) => ({ value: c, label: c }))}
                  />
                  <TextField form={form} name="phone" label="Teléfono" />
                  <TextField
                    form={form}
                    name="email"
                    label="Email personal"
                    type="email"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Laboral */}
            <TabsContent value="laboral">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Información Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <TextField form={form} name="position" label="Cargo *" />
                  <TextField
                    form={form}
                    name="area"
                    label="Área / Departamento"
                  />
                  <TextField
                    form={form}
                    name="hire_date"
                    label="Fecha de ingreso *"
                    type="date"
                  />
                  <SelectField
                    form={form}
                    name="payment_frequency"
                    label="Frecuencia de pago"
                    options={[
                      { value: "monthly", label: "Mensual" },
                      { value: "biweekly", label: "Quincenal" },
                      { value: "weekly", label: "Semanal" },
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Contrato */}
            <TabsContent value="contrato">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contrato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload PDF + AI */}
                  <div className="space-y-3 rounded-lg border border-dashed p-4">
                    <Label className="flex items-center gap-2">
                      <Upload className="size-4" />
                      Subir PDF del contrato
                    </Label>
                    <input
                      ref={contractInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        setContractFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => contractInputRef.current?.click()}
                      >
                        {contractFile ? contractFile.name : "Seleccionar PDF"}
                      </Button>
                      <Button
                        type="button"
                        onClick={onExtract}
                        disabled={extracting || !contractFile}
                      >
                        {extracting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        Extraer datos con AI
                      </Button>
                    </div>
                    <Alert>
                      <FileText />
                      <AlertTitle>Extracción asistida</AlertTitle>
                      <AlertDescription>
                        Sube el PDF y usa la AI para pre-llenar el formulario. Si
                        no está disponible, completa los campos manualmente.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      form={form}
                      name="type"
                      label="Tipo de contrato *"
                      options={[
                        { value: "fixed_term", label: "Término Fijo" },
                        { value: "indefinite", label: "Indefinido" },
                        { value: "work_contract", label: "Obra Labor" },
                      ]}
                    />
                    {type === "fixed_term" && (
                      <TextField
                        form={form}
                        name="end_date"
                        label="Fecha de fin *"
                        type="date"
                      />
                    )}
                    <div className="space-y-2 sm:col-span-2">
                      <div className="sm:max-w-[calc(50%-0.5rem)]">
                        <NumberField
                          form={form}
                          name="base_salary"
                          label="Salario base *"
                          min={SALARIO_MINIMO}
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      {salary != null && salary !== 0 && (
                        <Alert variant={appliesTransport ? "success" : "default"}>
                          <AlertDescription>
                            {appliesTransport
                              ? `✓ Aplica auxilio de transporte (${formatCOP(
                                  AUXILIO_TRANSPORTE
                                )}) — salario ≤ 2 SMMLV`
                              : "✗ No aplica auxilio de transporte — salario > 2 SMMLV"}
                          </AlertDescription>
                        </Alert>
                      )}
                      {appliesTransport && (
                        <div
                          className="sm:max-w-[calc(50%-0.5rem)]"
                          title="Este valor es calculado automáticamente por el sistema según la ley colombiana"
                        >
                          <Label className="mb-2 flex items-center gap-1.5 text-muted-foreground">
                            <Lock className="size-3.5" />
                            Auxilio de transporte (calculado automáticamente)
                          </Label>
                          <Input
                            readOnly
                            disabled
                            value={formatCOP(AUXILIO_TRANSPORTE)}
                            className="bg-muted text-muted-foreground"
                          />
                        </div>
                      )}
                    </div>
                    <TextField form={form} name="eps" label="EPS *" />
                    <TextField form={form} name="afp" label="AFP *" />
                    <TextField form={form} name="arl" label="ARL *" />
                    <TextField
                      form={form}
                      name="compensation_fund"
                      label="Caja de compensación *"
                    />
                    <SelectField
                      form={form}
                      name="work_schedule"
                      label="Jornada"
                      options={[
                        { value: "Completa", label: "Completa" },
                        { value: "Medio tiempo", label: "Medio tiempo" },
                        { value: "Por horas", label: "Por horas" },
                      ]}
                    />
                    <NumberField
                      form={form}
                      name="weekly_hours"
                      label="Horas semanales"
                      step="1"
                      placeholder="0"
                    />
                    <SelectField
                      form={form}
                      name="modality"
                      label="Modalidad"
                      options={[
                        { value: "Presencial", label: "Presencial" },
                        { value: "Remoto", label: "Remoto" },
                        { value: "Híbrido", label: "Híbrido" },
                      ]}
                    />
                    <TextField
                      form={form}
                      name="work_location"
                      label="Lugar de trabajo"
                    />
                    <NumberField
                      form={form}
                      name="mobility_allowance"
                      label="Auxilio de movilidad"
                      step="0.01"
                      placeholder="0"
                    />
                    <NumberField
                      form={form}
                      name="food_allowance"
                      label="Auxilio de alimentación"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>

                  {/* Otros auxilios: lista dinámica */}
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Label>Otros auxilios</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAllowanceDialogOpen(true)}
                      >
                        <Plus className="size-4" />
                        Agregar auxilio
                      </Button>
                    </div>
                    {otherAllowances.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay auxilios adicionales.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {otherAllowances.map((a, i) => (
                          <Badge
                            key={`${a.name}-${i}`}
                            variant="secondary"
                            className="gap-1 py-1"
                          >
                            {a.name} {formatCOP(a.amount)}
                            <button
                              type="button"
                              onClick={() => removeAllowance(i)}
                              className="ml-1 rounded-full hover:text-destructive"
                              aria-label={`Eliminar ${a.name}`}
                            >
                              <X className="size-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {otherAllowances.length > 0 && (
                      <p className="text-sm font-medium">
                        Total otros auxilios: {formatCOP(otherAllowancesTotal)}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="probation_period"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="mt-0!">
                          Tiene período de prueba
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {probationPeriod && (
                    <div className="sm:max-w-xs">
                      <NumberField
                        form={form}
                        name="probation_days"
                        label="Días de prueba"
                        step="1"
                        placeholder="0"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: Bancaria */}
            <TabsContent value="bancaria">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Información Bancaria
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    form={form}
                    name="bank"
                    label="Banco"
                    placeholder="Selecciona banco"
                    options={banks.map((b) => ({ value: b, label: b }))}
                  />
                  <SelectField
                    form={form}
                    name="account_type"
                    label="Tipo de cuenta"
                    placeholder="Selecciona"
                    options={[
                      { value: "Ahorros", label: "Ahorros" },
                      { value: "Corriente", label: "Corriente" },
                    ]}
                  />
                  <TextField
                    form={form}
                    name="account_number"
                    label="Número de cuenta"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(listUrl)}
            >
              Cancelar
            </Button>
            <span
              title={
                isValid ? undefined : "Completa todos los campos requeridos"
              }
            >
              <Button type="submit" disabled={!isValid || mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Guardar
              </Button>
            </span>
          </div>
        </form>
      </Form>

      {/* Dialog: agregar otro auxilio */}
      <Dialog open={allowanceDialogOpen} onOpenChange={setAllowanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar auxilio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allowance-name">Nombre del auxilio *</Label>
              <Input
                id="allowance-name"
                value={allowanceName}
                onChange={(e) => setAllowanceName(e.target.value)}
                placeholder="Ej: Bono navideño"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowance-amount">Monto *</Label>
              <Input
                id="allowance-amount"
                type="number"
                min={0}
                step="0.01"
                value={allowanceAmount}
                onChange={(e) => setAllowanceAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAllowanceDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={addAllowance}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------ Field helpers ------------------------------ */

type FieldForm = ReturnType<typeof useForm<EmployeeFormValues>>
type FieldName = keyof EmployeeFormValues

function TextField({
  form,
  name,
  label,
  type = "text",
  inputMode,
}: {
  form: FieldForm
  name: FieldName
  label: string
  type?: string
  inputMode?: "numeric" | "text"
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
              type={type}
              inputMode={inputMode}
              {...field}
              value={(field.value as string) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function NumberField({
  form,
  name,
  label,
  min,
  step = "0.01",
  placeholder,
}: {
  form: FieldForm
  name: FieldName
  label: string
  min?: number
  step?: string
  placeholder?: string
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
              min={min}
              step={step}
              placeholder={placeholder}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              // Si el valor es 0 o vacío, mostramos el placeholder vacío.
              value={
                field.value === undefined ||
                field.value === null ||
                field.value === 0 ||
                Number.isNaN(field.value)
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

function SelectField({
  form,
  name,
  label,
  options,
  placeholder = "Selecciona",
  disabled,
  onChange,
}: {
  form: FieldForm
  name: FieldName
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  onChange?: (value: string) => void
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={(field.value as string) || undefined}
            disabled={disabled}
            onValueChange={(v) => {
              field.onChange(v)
              onChange?.(v)
            }}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
