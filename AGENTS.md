# AGENTS.md – AVENCY Booking (RB-MS)

## Ziel
Baue Änderungen so, dass das Projekt ohne lokale Umgebung über GitHub + Render deploybar bleibt.
Keine manuellen Shell-Schritte beim Nutzer voraussetzen.

## Repo-Struktur
- `backend/` Node/Express + Prisma (Postgres)
- `frontend/` Vite + React (Render Static Site)

## Deployment (Render)
- Backend läuft als Web Service (Docker).
- Frontend läuft als Static Site (Vite build).
- Änderungen müssen nach Merge in `main` deploybar sein.

## Wichtige ENV Variablen
### Backend (Render Web Service)
- `DATABASE_URL` (Render Postgres)
- `JWT_SECRET` (Admin Auth)
- `ADMIN_EMAIL` (Breakglass)
- `ADMIN_PASSWORD` (Breakglass)

### Frontend (Render Static Site)
- `VITE_API_BASE_URL` (z.B. `https://rb-ms.onrender.com`)

## Prisma / DB Regeln
- Schema liegt in `backend/prisma/schema.prisma`.
- Bei Schemaänderungen: Migration committen.
- Sicherstellen, dass in Render:
  - Migrationen angewendet werden (`prisma migrate deploy`)
  - Prisma Client verfügbar ist (`prisma generate` vor Start/Build)
- Keine Breaking Changes ohne Migrationspfad.

## API Regeln
- Kein `/api` Prefix, Routen sind root-basiert (z.B. `/health`, `/occupancy`).
- CORS ist aktiviert, damit Static Site die API callen kann.

## Produkt-Modi
- Booking Mode (Default): nur ansehen + freie Tische buchen.
- Admin Mode: Floorplans/Desks verwalten, Buchungen anderer editieren/löschen, Mitarbeiter verwalten.
- Admin UI ist Editor-like: Canvas bleibt sichtbar, Properties rechts, Tabellen nur wo sinnvoll.

## UI Leitplanken
- 3-Spalten Layout: links Kalender (Mo-Start), Mitte Floorplan, rechts Anwesenheit/Details.
- Overlays/Popups nie im scrollenden Container rendern → Portal (`document.body`) + `position: fixed` + edge-clamp.
- Keine Koordinaten-Inputs im UI → visuelles „Neu anordnen“.

## Arbeitsweise für Änderungen
- Kleine, reviewbare PRs bevorzugen.
- Keine großen Refactors ohne Nutzen.
- Immer: Typescript Build muss grün sein, Render Deploy darf nicht brechen.

## Akzeptanzkriterien (immer prüfen)
- Frontend: `npm run build` läuft
- Backend: startet ohne Prisma-Init-Fehler
- `/health` liefert ok
- CORS erlaubt Frontend → Backend Requests
