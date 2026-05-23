# Docker — Halleyx Dashboard

Run the **entire** stack (frontend + backend + SQLite + migrations + Socket.io) with one command:

```bash
docker compose up --build
```

| Service  | URL                     | Port |
|----------|-------------------------|------|
| Frontend | http://localhost:5173   | 5173 |
| Backend  | http://localhost:3000   | 3000 |
| Health   | http://localhost:3000/health | 3000 |

---

## Folder structure (Docker-related)

```
Halleyx-Dashboard-Project-main/
├── docker-compose.yml          # Main orchestration (dev + hot reload)
├── docker-compose.prod.yml     # Optional production overlay
├── .env.example                # Root env template
├── DOCKER.md                   # This file
├── backend/
│   ├── Dockerfile              # Multi-stage: development | production
│   ├── docker-entrypoint.sh    # prisma generate + migrate deploy
│   ├── .dockerignore
│   └── .env.example
└── frontend/
    ├── Dockerfile              # Multi-stage: development | production
    ├── nginx.conf              # Production static server
    ├── .dockerignore
    └── .env.example
```

---

## What happens on `docker compose up --build`

1. **Backend image**
   - `npm ci` (cached layer)
   - Copies Prisma schema + source
   - Entrypoint runs `prisma generate` + `prisma migrate deploy`
   - Starts `ts-node --watch` (hot reload)

2. **Frontend image**
   - `npm ci`
   - Starts Vite on `0.0.0.0:5173` with file polling (Docker-friendly)

3. **Volumes**
   - `sqlite_data` → `/app/data/dev.db` (persists after `docker compose down`)
   - Source mounts for hot reload (`backend/src`, `frontend/src`)

4. **Health checks**
   - Backend must pass `/health` before frontend starts
   - Both services use `restart: unless-stopped`

---

## Environment variables

| Variable       | Default                         | Used by   |
|----------------|---------------------------------|-----------|
| `VITE_API_URL` | `http://localhost:3000`         | Frontend  |
| `JWT_SECRET`   | dev secret in compose           | Backend   |
| `CORS_ORIGIN`  | `http://localhost:5173,...`     | Backend   |
| `DATABASE_URL` | `file:/app/data/dev.db`         | Backend   |

Copy optional root env file:

```bash
cp .env.example .env
```

---

## Networking (why not `http://backend:3000` in the browser?)

- **Inside Docker:** services talk via names `backend`, `frontend` on `halleyx-net`.
- **In your browser:** JavaScript runs on the host, so API URL must be **`http://localhost:3000`** (published port).
- **Socket.io** uses the same `VITE_API_URL` as REST.

---

## Commands

```bash
# Start (foreground)
docker compose up --build

# Start (detached)
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and remove DB volume (fresh database)
docker compose down -v

# Production build (nginx + compiled Node)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

---

## Troubleshooting

### Port already in use

```text
Error: bind: address already in use
```

Stop local Node/Vite or change ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"   # backend
  - "5174:5173"   # frontend
```

Set `VITE_API_URL=http://localhost:3001`.

### Frontend cannot reach API

- Confirm backend health: `curl http://localhost:3000/health`
- Ensure `VITE_API_URL` matches the **host** port mapping, not `backend:3000`.

### Prisma / database errors

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend ls -la /app/data
```

Reset database:

```bash
docker compose down -v
docker compose up --build
```

### Hot reload not working on Windows

Vite uses `usePolling: true` in `vite.config.ts`. If needed, restart frontend:

```bash
docker compose restart frontend
```

### Socket.io not connecting

- Check browser console for CORS errors.
- Ensure `CORS_ORIGIN` includes your frontend URL.
- Backend must be healthy before frontend loads.

### Entrypoint permission denied

```bash
docker compose build --no-cache backend
```

Ensure `docker-entrypoint.sh` has LF line endings (not CRLF).

---

## Verify stack

```bash
curl http://localhost:3000/health
curl -I http://localhost:5173
```

Open http://localhost:5173 → Register → Login → Orders / Dashboard / Build.
