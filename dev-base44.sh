#!/bin/sh
set -e

# Install dependencies if not already present (named volume persists them).
if [ ! -d node_modules/vite ]; then
  echo "[base44] Installing dependencies…"
  npm install --no-audit --no-fund
fi

# Map server-side Supabase vars to the VITE_-prefixed vars the client bundle
# needs, unless the VITE_ variant was provided directly.
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL}"
export VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-$SUPABASE_PUBLISHABLE_KEY}"

exec node_modules/.bin/vite dev --port 3000 --host 0.0.0.0
