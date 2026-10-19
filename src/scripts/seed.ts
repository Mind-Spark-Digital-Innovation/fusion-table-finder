import { db } from '../adapters/persistence/database';

console.log('🌱 Initializing and seeding Oracle Fusion Metadata database...');

// --- DESTRUCTION & CLEANUP (Idempotent Reset) ---
db.run('DELETE FROM relationships;');
db.run('DELETE FROM columns;');
db.run('DELETE FROM tables;');
console.log('🧹 Existing database tables cleared.');

// --- 1. SEED TABLES (HCM & Payroll Modules) ---
// Note: We omit 'id' since it's an INTEGER PRIMARY KEY AUTOINCREMENT
const insertTable = db.prepare(`
  INSERT INTO tables (name, module, description_en, description_fr) 
  VALUES ($name, $module, $description_en, $description_fr)
`);

const tables = [
  {
    name: 'PER_ALL_PEOPLE_F',
    module: 'Global HR',
    description_en:
      'Person table maintaining biographical and demographic details over time.',
    description_fr:
      'Table des personnes gérant les détails biographiques et démographiques au fil du temps.',
  },
  {
    name: 'PER_ALL_ASSIGNMENTS_M',
    module: 'Global HR',
    description_en:
      'Worker assignment details including job, position, and organization links.',
    description_fr:
      "Détails d'affectation du travailleur, y compris les liens d'emploi, de poste et d'organisation.",
  },
  {
    name: 'PAY_PAY_RELATIONSHIPS_F',
    module: 'Payroll',
    description_en:
      'Payroll relationship tracking legal employer to worker association.',
    description_fr:
      "Relation de paie suivant l'association de l'employeur légal au travailleur.",
  },
  {
    name: 'PAY_PAYROLL_ACTIONS',
    module: 'Payroll',
    description_en:
      'Payroll action parameters for processing runs, calculations, and archivers.',
    description_fr:
      "Paramètres d'action de paie pour l'exécution des traitements, calculs et archivages.",
  },
];

for (const t of tables) {
  insertTable.run({
    $name: t.name,
    $module: t.module,
    $description_en: t.description_en,
    $description_fr: t.description_fr,
  });
}
console.log(`📦 Seeded ${tables.length} Oracle Fusion tables.`);

// --- Helper to fetch auto-generated table IDs by table name ---
function getTableId(tableName: string): number {
  const row = db
    .query(`SELECT id FROM tables WHERE name = $name`)
    .get({ $name: tableName }) as { id: number };
  return row.id;
}

// --- 2. SEED KEY COLUMNS ---
const insertColumn = db.prepare(`
  INSERT INTO columns (table_id, name, data_type, is_primary_key) 
  VALUES ($table_id, $name, $data_type, $is_primary_key)
`);

// We dynamically fetch the table_id using the table name to maintain correct foreign keys
const columns = [
  {
    table_name: 'PER_ALL_PEOPLE_F',
    name: 'PERSON_ID',
    data_type: 'NUMBER',
    is_primary_key: 1,
  },
  {
    table_name: 'PER_ALL_ASSIGNMENTS_M',
    name: 'ASSIGNMENT_ID',
    data_type: 'NUMBER',
    is_primary_key: 1,
  },
  {
    table_name: 'PER_ALL_ASSIGNMENTS_M',
    name: 'PERSON_ID',
    data_type: 'NUMBER',
    is_primary_key: 0,
  },
  {
    table_name: 'PAY_PAY_RELATIONSHIPS_F',
    name: 'PAYROLL_RELATIONSHIP_ID',
    data_type: 'NUMBER',
    is_primary_key: 1,
  },
  {
    table_name: 'PAY_PAY_RELATIONSHIPS_F',
    name: 'PERSON_ID',
    data_type: 'NUMBER',
    is_primary_key: 0,
  },
  {
    table_name: 'PAY_PAYROLL_ACTIONS',
    name: 'PAYROLL_ACTION_ID',
    data_type: 'NUMBER',
    is_primary_key: 1,
  },
  {
    table_name: 'PAY_PAYROLL_ACTIONS',
    name: 'PAYROLL_RELATIONSHIP_ID',
    data_type: 'NUMBER',
    is_primary_key: 0,
  },
];

for (const c of columns) {
  const tableId = getTableId(c.table_name);
  insertColumn.run({
    $table_id: tableId,
    $name: c.name,
    $data_type: c.data_type,
    $is_primary_key: c.is_primary_key,
  });
}
console.log(`🔑 Seeded ${columns.length} columns.`);

// --- 3. SEED RELATIONSHIPS (Weighted Edges for Dijkstra) ---
const insertRelationship = db.prepare(`
  INSERT INTO relationships (source_table, target_table, source_column, target_column, weight, relationship_type) 
  VALUES ($source_table, $target_table, $source_column, $target_column, $weight, $relationship_type)
`);

const relationships = [
  {
    source_table: 'PER_ALL_PEOPLE_F',
    target_table: 'PER_ALL_ASSIGNMENTS_M',
    source_column: 'PERSON_ID',
    target_column: 'PERSON_ID',
    weight: 1.0,
    relationship_type: 'FK_EXPLICIT',
  },
  {
    source_table: 'PER_ALL_PEOPLE_F',
    target_table: 'PAY_PAY_RELATIONSHIPS_F',
    source_column: 'PERSON_ID',
    target_column: 'PERSON_ID',
    weight: 1.2,
    relationship_type: 'FK_EXPLICIT',
  },
  {
    source_table: 'PAY_PAY_RELATIONSHIPS_F',
    target_table: 'PAY_PAYROLL_ACTIONS',
    source_column: 'PAYROLL_RELATIONSHIP_ID',
    target_column: 'PAYROLL_RELATIONSHIP_ID',
    weight: 1.0,
    relationship_type: 'FK_EXPLICIT',
  },
];

for (const r of relationships) {
  insertRelationship.run({
    $source_table: r.source_table,
    $target_table: r.target_table,
    $source_column: r.source_column,
    $target_column: r.target_column,
    $weight: r.weight,
    $relationship_type: r.relationship_type,
  });
}
console.log(`🔗 Seeded ${relationships.length} relationship edges.`);

console.log(
  '✅ Successfully seeded mock Oracle Fusion database (`fusion_metadata.db`)!',
);
