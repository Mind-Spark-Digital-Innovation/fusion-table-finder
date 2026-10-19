import { Database } from 'bun:sqlite';

// Opens or creates fusion_metadata.db locally
export const db = new Database('fusion_metadata.db', { create: true });

// Enable performance mode and foreign key constraints
db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA foreign_keys = ON;');

/**
 * Ensures all core SQLite tables exist in the database.
 */
export function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      module TEXT NOT NULL,
      description_en TEXT,
      description_fr TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id TEXT NOT NULL,
      name TEXT NOT NULL,
      data_type TEXT NOT NULL,
      is_primary_key INTEGER DEFAULT 0,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_table TEXT NOT NULL,
      target_table TEXT NOT NULL,
      source_column TEXT NOT NULL,
      target_column TEXT NOT NULL,
      weight REAL NOT NULL,
      relationship_type TEXT NOT NULL,
      FOREIGN KEY (source_table) REFERENCES tables(name) ON DELETE CASCADE,
      FOREIGN KEY (target_table) REFERENCES tables(name) ON DELETE CASCADE
    );
  `);

  console.log('📂 Database initialized and schemas verified.');
}

// Automatically initialize when imported by other files
initializeDatabase();

if (import.meta.main) {
  console.log('⚡ Running database initialization directly...');
  initializeDatabase();
}
