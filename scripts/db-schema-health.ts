import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

type ColumnRequirement = { table: string; column: string };
type TableRequirement = { table: string };
type Requirement = ColumnRequirement | TableRequirement;

const REQUIREMENTS: Requirement[] = [
  // Drift observed in local validation: these objects were missing and produced noisy stack traces.
  { table: "cooking_sessions", column: "recipe_snapshot" },
  { table: "ai_interactions" },
  { table: "prompt_versions" },
  { table: "anonymous_recipe_usage" },

  // Core runtime tables used by authenticated flows.
  { table: "auth_users" },
  { table: "user_settings" },
];

function isColumnRequirement(req: Requirement): req is ColumnRequirement {
  return "column" in req;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required for db schema health checks.");
    process.exit(2);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const tables = Array.from(new Set(REQUIREMENTS.map((req) => req.table)));
    const tableRes = await pool.query(
      `
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name = any($1::text[])
      `,
      [tables],
    );
    const presentTables = new Set<string>(tableRes.rows.map((row) => String(row.table_name)));

    const missingTables = tables.filter((table) => !presentTables.has(table));
    const missingColumns: string[] = [];

    for (const req of REQUIREMENTS) {
      if (!presentTables.has(req.table)) {
        continue;
      }

      if (!isColumnRequirement(req)) {
        continue;
      }

      const colRes = await pool.query(
        `
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = $1
            and column_name = $2
          limit 1
        `,
        [req.table, req.column],
      );

      if (colRes.rowCount === 0) {
        missingColumns.push(`${req.table}.${req.column}`);
      }
    }

    if (missingTables.length || missingColumns.length) {
      console.error("DB schema health check failed.");
      if (missingTables.length) {
        console.error(`Missing tables: ${missingTables.join(", ")}`);
      }
      if (missingColumns.length) {
        console.error(`Missing columns: ${missingColumns.join(", ")}`);
      }
      process.exit(1);
    }

    console.log("DB schema health check passed.");
  } finally {
    await pool.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error("DB schema health check errored:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
