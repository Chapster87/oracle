// Runs the pgTAP RLS suite against the database in DATABASE_URL.
//
// The suite opens its own transaction and rolls back, so it is safe to run
// against a live database. psql is used rather than the Supabase CLI because
// the project is not linked, and because the suite needs explicit
// begin/rollback that a pooled JS client will not carry.
import { spawnSync } from "node:child_process"

import dotenv from "dotenv"

dotenv.config({ path: ".env.local", quiet: true })

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL missing from .env.local")

const parsed = new URL(url)
const password = process.env.DB_PASSWORD || parsed.password
parsed.password = ""

const result = spawnSync(
  "psql",
  [
    parsed.toString(),
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "supabase/tests/rls.test.sql",
  ],
  { env: { ...process.env, PGPASSWORD: password }, encoding: "utf8" }
)

process.stdout.write(result.stdout ?? "")
process.stderr.write(result.stderr ?? "")
process.exit(result.status ?? 1)
