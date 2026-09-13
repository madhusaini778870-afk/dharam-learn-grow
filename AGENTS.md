<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in the
> editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Base44 Dev Environment

## Stack
TanStack Start (Vite + React SSR via nitro) + Supabase (auth + database).
Single-origin app: the API routes (server functions) live inside the Vite/nitro
dev server — no separate backend service. Course catalog data is fetched
server-side from a public third-party API (physicswallahx.vercel.app).

## Running
```sh
docker compose -f docker-compose.base44.yml up -d
```
- Web entry point: http://localhost:3000
- `dev-base44.sh` installs deps on first boot (named volume `node_modules`),
  maps `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` → `VITE_`-prefixed vars for the
  client bundle, then runs `vite dev --port 3000 --host 0.0.0.0`.
- Live reload is active (Vite HMR + SSR). File watching uses polling
  (`CHOKIDAR_USEPOLLING=true`) for bind-mount compatibility.

## Secrets (external — user-provided)
Delivered via `/run/base44/app.env`, loaded last in compose `env_file` so they
override the placeholders in `.env.base44-defaults`.

| Key | Required | Purpose |
|-----|----------|---------|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | yes | Supabase anon/publishable key (client auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase service role key (server admin: enrollments, progress) |
| `LOVABLE_API_KEY` | no | Lovable AI gateway key for the AI Doubt Solver |

Without real Supabase credentials the app boots and shows the auth page, but
signup/sign-in and all data features (enrollments, progress, courses behind
auth) will not work. The public course catalog endpoint needs no credentials.

## Verifying
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → 200
- The splash screen ("Dharam Bhai Study · Learn · Practice · Grow") should render.
- After ~1.4s it redirects to `/auth` (no session) or `/home` (logged in).
