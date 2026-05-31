# BOLTRAIN — Frontend

Plataforma de comercio internacional descentralizado para Bolivia.

## Stack

- React 18
- React Router v6
- Axios
- CSS Variables (design system propio)

## Instalación

```bash
npm install
cp .env.example .env
npm start
```

## Estructura

```
src/
├── components/
│   ├── common/       # Navbar, Button, Input, etc.
│   ├── auth/         # Login, Register
│   ├── dashboard/    # Dashboard importador
│   ├── containers/   # Contenedores y cotizaciones
│   └── logistics/    # Servicios logísticos
├── pages/            # Landing, Login, Register, Dashboard
├── services/         # Llamadas a la API (axios)
├── hooks/            # useAuth, useFetch
├── context/          # AuthContext
└── utils/            # Helpers, formatters
```

## Ramas

- `main` — código estable
- `develop` — integración
- `feature/auth` — registro y login
- `feature/containers` — módulo contenedores
- `feature/logistics` — servicios logísticos
- `feature/dashboard` — dashboard principal

## Equipo

| Rol | Responsable |
|-----|-------------|
| Frontend Lead | - |
| UI/UX | - |
| Integración API | - |
| Testing | - |
