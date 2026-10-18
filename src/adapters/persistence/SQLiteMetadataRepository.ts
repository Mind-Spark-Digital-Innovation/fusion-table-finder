import { Database } from 'bun:sqlite';
import { type MetadataRepository } from '@ports/MetadataRepository';
import {
  type FusionTable,
  type FusionColumn,
  type FusionRelationshipEdge,
} from '@domain/entities';

export class SQLiteMetadataRepository implements MetadataRepository {
  constructor(private db: Database) {}

  getAllTables(): FusionTable[] {
    const rows = this.db
      .query(
        `
      SELECT name, module_en as moduleEn, module_fr as moduleFr, 
             description_en as descriptionEn, description_fr as descriptionFr 
      FROM fusion_tables
    `,
      )
      .all() as any[];
    return rows;
  }

  getTableColumns(tableName: string): FusionColumn[] {
    const rows = this.db
      .query(
        `
      SELECT table_name as tableName, column_name as columnName, data_type as dataType, 
             is_primary_key as isPrimaryKey, is_foreign_key as isForeignKey 
      FROM fusion_columns WHERE table_name = ?
    `,
      )
      .all(tableName) as any[];

    return rows.map((r) => ({
      ...r,
      isPrimaryKey: Boolean(r.isPrimaryKey),
      isForeignKey: Boolean(r.isForeignKey),
    }));
  }

  getAllRelationships(): FusionRelationshipEdge[] {
    return this.db
      .query(
        `
      SELECT source_table as sourceTable, source_column as sourceColumn, 
             target_table as targetTable, target_column as targetColumn, 
             weight, relationship_type as relationshipType 
      FROM fusion_relationships
    `,
      )
      .all() as any[];
  }

  searchTables(query: string): FusionTable[] {
    const searchTerm = `%${query}%`;
    const rows = this.db
      .query(
        `
      SELECT name, module_en as moduleEn, module_fr as moduleFr, 
             description_en as descriptionEn, description_fr as descriptionFr 
      FROM fusion_tables 
      WHERE name LIKE ? OR module_en LIKE ? OR module_fr LIKE ? 
         OR description_en LIKE ? OR description_fr LIKE ? 
      LIMIT 20
    `,
      )
      .all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm) as any[];
    return rows;
  }
}
