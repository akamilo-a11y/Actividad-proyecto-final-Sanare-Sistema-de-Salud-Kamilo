# SaludPública Connect

Sistema de gestión de turnos para salud pública con triaje por IA. Es un monorepo que contiene un backend **NestJS + Prisma** y un frontend **React (Vite) + Tailwind**, con **PostgreSQL** y **Redis** vía Docker.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 10, Prisma 5, JWT (Passport), Bull (colas), Nodemailer |
| Base de datos | PostgreSQL 16 (Docker) |
| Cola / caché | Redis 7 (Docker) + Redis Commander (UI web) |
| Frontend | React 19, Vite 6, React Router, Recharts, Lucide |
| IA | Google Gemini (SDK `@google/genai`) con fallback heurístico |

## Estructura

```
.
├── docker-compose.yml          # Postgres (5433) + Redis (6379) + Redis Commander (8081)
├── Ejercicio_SaludPublica_Connect.docx
├── backend/                    # API NestJS (puerto 3001)
│   ├── prisma/                 # schema, migraciones y seed
│   └── src/
│       ├── auth/               # login/registro + JWT + roles
│       ├── specialties/        # especialidades
│       ├── doctors/            # doctores + generación de horarios
│       ├── appointments/       # reserva atómica + cancelación pública por token
│       ├── mail/               # Nodemailer (Ethereal en dev)
│       ├── notifications/      # colas Bull
│       └── ai/                 # triaje IA (Gemini + fallback)
└── frontend/                   # SPA React (puerto 3000)
    └── src/
        ├── components/         # HomePage, Login, Register, TriageChat, AppointmentScheduler,
        │                       # AppointmentPublicView, DoctorDashboard, AdminDashboard,
        │                       # DoctorManagement, DoctorDetailModal, AppointmentsCalendar, Navbar
        ├── context/            # AuthContext
        ├── services/           # api, auth, gemini, doctor, specialty, appointment
        └── types/              # modelos TypeScript
```

## Roles

- **PATIENT**: triaje IA, reservar turnos, ver/cancelar sus turnos.
- **DOCTOR**: usa la ruta `/doctor` para ver y cancelar los turnos de su especialidad (filtrado por `doctor.userId`).
- **ADMIN**: panel `/admin` con estadísticas, gestión de doctores y calendario de turnos.

## Requisitos

- Node.js 20+ y npm
- Docker Desktop (con el motor en marcha)
- `.env` con `GEMINI_API_KEY` (ver `backend/.env`)

> **Nota de puertos:** el contenedor de PostgreSQL se publica en el host como `5433` para no chocar con un PostgreSQL nativo ya instalado en `5432`. Configúralo en `backend/.env` (`DATABASE_URL`) y en `docker-compose.yml`.

## Puesta en marcha

```bash
# 1. Levantar infraestructura (Postgres + Redis + Redis Commander)
docker compose up -d

# 2. Backend
cd backend
npm install
npx prisma migrate deploy        # aplica migraciones
npm run prisma:seed              # datos de demo
npm run build
node dist/src/main.js            # API en http://localhost:3001

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run build
npm run preview                  # o npm run dev  → http://localhost:3000
```

## Credenciales de demo

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@saludpublica.com` | `123456` |
| Paciente | `paciente1@email.com` | `123456` |
| Doctor | `doctor1@email.com` | `123456` |

## URLs de Servicios y Documentación

| Servicio | URL | Descripción |
|---|---|---|
| **Frontend Web** | [http://localhost:3000](http://localhost:3000) | Aplicación SPA de pacientes, doctores y administración |
| **Backend API** | [http://localhost:3001](http://localhost:3001) | Servidor NestJS |
| **Swagger Docs** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Documentación interactiva de la API OpenAPI / Swagger |
| **Redis Commander** | [http://localhost:8081](http://localhost:8081) | Explorador web de colas y datos Redis |

## API principal

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/specialties`, `GET /api/specialties/:id`
- `GET /api/doctors`, `GET /api/doctors/:id`, create/update/delete (ADMIN)
- `POST /api/doctors/:id/slots/generate` — genera horarios libres para el doctor
- `GET /api/appointments` — por rol (ADMIN todos, DOCTOR sus pacientes, PATIENT los suyos)
- `POST /api/appointments` — reserva atómica en transacción (rechaza doble reserva concurrente con 400):
  ```json
  {
    "doctorId": "uuid-doctor",
    "patientName": "Juan Pérez",
    "patientPhone": "+54 11 1234-5678",
    "patientEmail": "juan@email.com",
    "date": "2026-09-16T13:00:00.000Z",
    "notes": "Motivo o síntomas"
  }
  ```
- `GET /api/appointments/stats` — métricas y gráficos para el panel del admin
- `GET /api/appointments-public/token/:token`, `POST /api/appointments-public/cancel/:token` — consulta y cancelación pública por token único
- `POST /api/ai/triage` — analiza síntomas con Gemini (fallback heurístico si la API no responde)

## Correo

En desarrollo, sin credenciales SMTP reales, se usa **Ethereal**: el servicio crea una cuenta de prueba y muestra/guarda la URL de vista previa (`nodemailer.getTestMessageUrl`). Para correo real, completá `EMAIL_USER` / `EMAIL_PASS` en `backend/.env`.

## Triaje IA

`POST /api/ai/triage` recibe `{ "symptoms": "..." }` y devuelve:

```json
{
  "recommendedSpecialty": "Neurología",
  "urgency": "Media",
  "reasoning": "Cefalea persistente de más de una semana..."
}
```

El servicio intenta con `gemini-3.6-flash` (y modelos de respaldo) con reintentos y backoff; si la API no responde, usa un `heuristicTriage` local para no dejar de funcionar.