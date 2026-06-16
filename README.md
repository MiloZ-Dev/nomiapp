<div align="center">

<img src="assets/banner.png" alt="NomiApp Banner" width="100%" />

# NomiApp

> Plataforma SaaS de gestión de nómina y contabilidad laboral para empresas colombianas.

NomiApp permite a contadores y administradores gestionar empleados, contratos y nóminas de múltiples empresas desde un solo lugar, con cálculos automáticos según la legislación colombiana vigente (SMMLV 2026) y generación de desprendibles de pago en PDF.

</div>

---

## ✨ Features

- 🏢 **Multi-empresa** — gestiona múltiples empresas desde un panel central
- 👥 **Gestión de empleados** — contratos término fijo, indefinido y obra labor
- 🧮 **Cálculo automático de nómina** — salud, pensión, auxilio de transporte según ley colombiana
- 📄 **Generación de PDFs** — nómina completa y desprendibles individuales por empleado
- 🔐 **Roles de acceso** — Super Admin y Admin por empresa
- 📊 **Dashboard por empresa** — resumen de empleados activos y costos laborales

---

## 🛠 Stack

### Frontend

| Tecnología | Descripción |
|---|---|
| ![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=white&style=flat-square) | Librería UI principal |
| ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white&style=flat-square) | Tipado estático |
| ![Vite](https://img.shields.io/badge/Vite_6-646CFF?logo=vite&logoColor=white&style=flat-square) | Bundler y dev server |
| ![Tailwind](https://img.shields.io/badge/Tailwind_4-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square) | Estilos utilitarios |
| ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white&style=flat-square) | Componentes accesibles (Radix UI) |
| ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white&style=flat-square) | Fetching y caché de datos |
| ![Zustand](https://img.shields.io/badge/Zustand-433E38?style=flat-square) | Estado global |
| ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?logo=reacthookform&logoColor=white&style=flat-square) | Manejo de formularios |
| ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square) | Validación de esquemas |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white&style=flat-square) | Cliente HTTP con interceptores JWT |

### Backend

| Tecnología | Descripción |
|---|---|
| ![Python](https://img.shields.io/badge/Python_3.13-3776AB?logo=python&logoColor=white&style=flat-square) | Lenguaje principal |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square) | Framework API REST async |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?logo=postgresql&logoColor=white&style=flat-square) | Base de datos relacional |
| ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square) | ORM async |
| ![Alembic](https://img.shields.io/badge/Alembic-6BA539?style=flat-square) | Migraciones de base de datos |
| ![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white&style=flat-square) | Autenticación stateless |
| ![ReportLab](https://img.shields.io/badge/ReportLab-CC0000?style=flat-square) | Generación de PDFs |
| ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=flat-square) | Contenedores (PostgreSQL + pgAdmin) |

---

## 🚀 Getting Started

### Prerrequisitos

- Node.js 18+
- Backend NomiApp corriendo en `http://localhost:8000`

### Instalación

```bash
git clone https://github.com/MiloZ-Dev/nomiapp.git
cd nomiapp
npm install
```

### Variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
```

---

## 📁 Estructura

```
src/
├── api/          # Clientes HTTP por módulo
├── components/   # Componentes UI reutilizables
├── context/      # AuthProvider y contexto global
├── hooks/        # Custom hooks
├── pages/        # Vistas por ruta
│   └── empresa/  # Dashboard, Empleados, Nómina
├── routes/       # Configuración de rutas y guards
├── store/        # Estado global (Zustand)
└── types/        # Tipos TypeScript
```

---

## 📸 Screenshots

*Próximamente — en desarrollo activo.*

---

## 👨‍💻 Autor

Desarrollado por [@MiloZ-Dev](https://github.com/MiloZ-Dev)

---

## 📝 Licencia

Propietario — todos los derechos reservados © 2026 NomiApp