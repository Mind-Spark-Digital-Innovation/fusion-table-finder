import { Database } from 'bun:sqlite';

export const db = new Database('fusion_metadata.db', { create: true });

db.run('PRAGMA journal_mode = WAL;');

export function initializeDatabase(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS fusion_tables (
      name TEXT PRIMARY KEY,
      module_en TEXT NOT NULL,
      module_fr TEXT NOT NULL,
      description_en TEXT,
      description_fr TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fusion_columns (
      table_name TEXT,
      column_name TEXT,
      data_type TEXT,
      is_primary_key INTEGER,
      is_foreign_key INTEGER,
      PRIMARY KEY (table_name, column_name),
      FOREIGN KEY (table_name) REFERENCES fusion_tables(name) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fusion_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_table TEXT,
      source_column TEXT,
      target_table TEXT,
      target_column TEXT,
      weight REAL NOT NULL,
      relationship_type TEXT,
      FOREIGN KEY (source_table) REFERENCES fusion_tables(name),
      FOREIGN KEY (target_table) REFERENCES fusion_tables(name)
    );
  `);

  db.run(
    `CREATE INDEX IF NOT EXISTS idx_rel_source ON fusion_relationships(source_table);`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_rel_target ON fusion_relationships(target_table);`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_table_modules ON fusion_tables(module_en, module_fr);`,
  );
}
