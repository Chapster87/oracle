// Applies one SQL file (or a -c query) to the database in DATABASE_URL.
//
// Mirrors run-rls-tests.mjs: psql is used because the project is not linked to
// the Supabase CLI, and because migrations need ON_ERROR_STOP semantics.
import { spawnSync } from "node:child_process"

import dotenv from "dotenv"

dotenv.config({ path: ".env.local", quiet: true })

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL missing from .env.local")

const parsed = new URL(url)
const password = process.env.DB_PASSWORD || parsed.password
parsed.password = ""

const args = [parsed.toString(), "-v", "ON_ERROR_STOP=1"]
if (process.argv[2] === "-c") {
  args.push("-c", process.argv[3])
} else if (process.argv[2]) {
  args.push("-f", process.argv[2])
} else {
  throw new Error("Usage: node scripts/apply-sql.mjs <file> | -c <query>")
}

const result = spawnSync("psql", args, {
  env: { ...process.env, PGPASSWORD: password },
  encoding: "utf8",
})

process.stdout.write(result.stdout ?? "")
process.stderr.write(result.stderr ?? "")
process.exit(result.status ?? 1)
