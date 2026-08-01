import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
import fs from "fs";
import path from "path";

/**
 * Assembles the connection string from environment variables.
 * Supports template substitution for DB_PASSWORD.
 */
function getConnectionString() {
  let url = process.env.DATABASE_URL;
  const password = process.env.DB_PASSWORD;

  if (!url) return null;

  if (password && url.includes("${DB_PASSWORD}")) {
    url = url.replace("${DB_PASSWORD}", password);
  }

  return url;
}

const connectionString = getConnectionString();

if (!connectionString || connectionString.includes("[YOUR-PASSWORD]")) {
  console.error(
    "❌ Error: DATABASE_URL is not configured correctly in .env.local",
  );
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
});

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

  try {
    // 1. Create a migrations table if it doesn't exist
    await sql.unsafe(`
      create table if not exists public._migrations (
        id uuid primary key default gen_random_uuid(),
        name text unique not null,
        applied_at timestamp with time zone default now()
      );
    `);

    if (!fs.existsSync(migrationsDir)) {
      console.error(
        "❌ Error: Migrations directory not found at",
        migrationsDir,
      );
      process.exit(1);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("ℹ️ No migration files found.");
      return;
    }

    // 2. Fetch applied migrations
    const appliedMigrations = await sql`select name from public._migrations`;
    const appliedNames = new Set(appliedMigrations.map((m) => m.name));

    console.log(`🚀 Found ${files.length} migration files...`);

    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`⏭️  Skipping already applied: ${file}`);
        continue;
      }

      console.log(`\n📄 Running ${file}...`);
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      // Use a transaction for each migration file
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`insert into public._migrations (name) values (${file})`;
      });

      console.log(`✅ Successfully applied ${file}`);
    }

    console.log("\n✨ Migration check completed!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
