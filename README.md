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

## Development tips

- Use the React DevTools and browser console to inspect runtime errors.
- The frontend will redirect to `/login` on 401 responses.
- Use the `authAPI.getProfile()` call to verify the current user payload shape while debugging role-based UI.

## Next improvements (frontend)

- Show assignment messages inline in the incidents table row rather than global Alert.
- Add unit tests for the assign flow and 403 UI handling.
- Improve error messages to include `assigned_at` when backend adds it.
