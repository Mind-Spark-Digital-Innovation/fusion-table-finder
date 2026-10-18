import {
  type FusionTable,
  type FusionColumn,
  type FusionRelationshipEdge,
} from '@domain/entities';

export interface MetadataRepository {
  getAllTables(): FusionTable[];
  getTableColumns(tableName: string): FusionColumn[];
  getAllRelationships(): FusionRelationshipEdge[];
  searchTables(query: string): FusionTable[];
}
