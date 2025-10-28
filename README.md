# BuildSync (starter scaffold)

This repository is a minimal starter monorepo scaffold for BuildSync (MVP). It contains placeholders for:

- apps/web — Next.js web app (admin & dashboard)
- apps/api — Node API with Prisma schema (Postgres)
- apps/mobile — Expo (React Native) mobile app placeholder

This scaffold is intentionally minimal so you can bootstrap locally and extend from here.

Requirements
- Node.js 18+ (LTS)
- npm 9+ (or use pnpm/yarn if you prefer)
- PostgreSQL for local development (or use Docker)

Quick start (PowerShell)

1) Clone / open this folder

2) Install dependencies at repo root:

```powershell
npm run bootstrap
```

3) Copy env example for API and edit values:

```powershell
copy .\.env.example .\.env
# Edit apps/api/.env if you want per-app env files
```

4) Start dev servers (three shells or use the combined dev script):

In 3 separate shells:

```powershell
# API
cd .\apps\api ; npm run dev

# Web
cd .\apps\web ; npm run dev

# Mobile (Expo)
cd .\apps\mobile ; npm run start
```

Or run combined (single terminal):

```powershell
npm run dev
```

Notes
- This scaffold doesn't install or configure production infra. Use Terraform / Pulumi and managed services for production.
- Next steps: wire Prisma migrations, add authentication, add Stripe keys, and implement UI flows.

If you want, I can now: scaffold full Next.js pages with auth, add a NestJS skeleton instead of the simple API here, or wire Prisma migrations and a local Docker Compose Postgres.
