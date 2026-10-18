export interface FusionTable {
  name: string;
  moduleEn: string;
  moduleFr: string;
  descriptionEn?: string;
  descriptionFr?: string;
}

export interface FusionColumn {
  tableName: string;
  columnName: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface FusionRelationshipEdge {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  weight: number;
  relationshipType: 'FK_EXPLICIT' | 'INFERRED_NAMING' | 'MANUAL_OVERRIDE';
}

export interface JoinPathResult {
  path: string[];
  totalWeight: number;
  steps: {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    weight: number;
  }[];
}
