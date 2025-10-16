# Frontend - Digital Voting System (React + Vite)

This document contains focused developer instructions for the frontend portion of the Digital Voting System.

## Location

All frontend code is in the `frontend/` folder. The Vite entry is `index.html` and main app code is under `frontend/src/`.

## Quick Start (Windows PowerShell)

```powershell
cd frontend
npm install
npm run dev
```

- Vite will print the dev server URL (typically `http://localhost:3000`). The frontend expects the backend API at `http://127.0.0.1:8000` by default.
- If your backend runs on a different host/port, update `API_BASE_URL` and `MEDIA_BASE_URL` in `frontend/src/services/api.js`.

## Key files and locations

- `frontend/src/services/api.js`: central Axios instance and API helpers. Adjust `API_BASE_URL` and `MEDIA_BASE_URL` here.
- `frontend/src/contexts/AuthContext.jsx`: provides authentication state and role helper booleans: `isAdmin`, `isInec`, `isVoter`, `isSuperuser`.
- `frontend/src/pages/admin/AdminDashboard.jsx`: admin dashboard (incidents, elections, voters).
- `frontend/src/pages/incidents/IncidentReport.jsx`: incident reporting and management UI.

## File uploads

- The frontend sends multipart/form-data when uploading files (e.g., incident evidence or candidate photos) using FormData.
- Example: when creating an incident, the frontend sends `evidence_files` fields in FormData.

## Error handling improvements

- The frontend now parses 403 payloads from the assign endpoint and shows a friendly message:

  "This incident is already assigned to Alice Smith. Only admins can reassign."

- Check the browser console while reproducing assign/reassign flows for helpful logs `IncidentReport loadMyIncidents - user:` and role helper logs.

```markdown
# Frontend — Digital Voting System (React + Vite)

This file contains focused developer instructions and notes for the frontend portion of the project.

## Location

All frontend code is in `frontend/`. The entrypoint is `index.html` and app sources live in `frontend/src/`.

## Quick start (Windows PowerShell)

```powershell
cd frontend
npm install
npm run dev
```

- Vite will print the dev server URL (commonly `http://localhost:3000`).
- The frontend reads API configuration from `import.meta.env.VITE_API_URL`. If you prefer, set `VITE_API_URL` in a `.env` file in the `frontend/` folder or edit `frontend/src/services/api.js`.

## Key files

- `frontend/src/services/api.js` — Axios instance and API helpers. Exports `authAPI`, `electionsAPI`, `votingAPI`, `incidentsAPI`, and `adminAPI` (which includes `getDashboardStats`).
- `frontend/src/contexts/AuthContext.jsx` — authentication state and role helpers: `isAdmin`, `isInec`, `isVoter`, `isSuperuser`.
- `frontend/src/pages/admin/AdminDashboard.jsx` — admin UI (overview, elections, voters, incidents, reports).
- `frontend/src/index.css` — global styles (includes the global gradient and `.soft-card` utility for frosted translucent cards).

## Uploads and form data

- File uploads use `multipart/form-data` via FormData. Incident evidence should be appended as `evidence_files` (array) and candidate photos as `photo`.

## Notable frontend behaviors

- Server-provided `user.age`: the backend exposes `age` from the user serializer; the Admin table prefers `user.age` and falls back to computing age from `dob` client-side.
- `adminAPI.getDashboardStats()` aggregates elections, voters, and incident stats and returns the shape consumed by `AdminDashboard`.
- The app uses a `.soft-card` CSS utility (see `frontend/src/index.css`) to create a frosted/translucent card look so the global background gradient is visible.

## Debugging tips

- Blank page or runtime errors: open browser DevTools Console and check Vite output in the terminal. Missing named exports or syntax errors are common causes.
- 401 responses cause the frontend to redirect to `/login`. Ensure `auth_token` exists in `localStorage` and `VITE_API_URL` points to your backend.
- If you see a DevTools compatibility note about `backdrop-filter`, the CSS includes `-webkit-backdrop-filter` to improve Safari support.

## Suggested next work

- Improve admin analytics endpoint to return a single aggregated payload so the frontend doesn't need to call multiple endpoints.
- Add unit tests for `authAPI`, `adminAPI.getDashboardStats`, and the voter verification flow.

If something in this README doesn't match what you see locally, paste the console/log output and I'll align the docs.
```
