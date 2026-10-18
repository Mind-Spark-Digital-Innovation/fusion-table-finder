import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import type { PathFinderPort } from '@ports/PathFinderPort.ts';
import type { MetadataRepository } from '@ports/MetadataRepository.ts';
import type { JoinPathResult } from '@domain/entities.ts';

export class GraphologyPathFinder implements PathFinderPort {
  private graph = new Graph({ multi: true });

  constructor(private metadataRepo: MetadataRepository) {}

  loadGraph(): void {
    const tables = this.metadataRepo.getAllTables();
    for (const table of tables) {
      if (!this.graph.hasNode(table.name)) {
        this.graph.addNode(table.name, {
          moduleEn: table.moduleEn,
          moduleFr: table.moduleFr,
          descriptionEn: table.descriptionEn,
          descriptionFr: table.descriptionFr,
        });
      }
    }

    const relationships = this.metadataRepo.getAllRelationships();
    for (const rel of relationships) {
      if (!this.graph.hasNode(rel.sourceTable)) {
        this.graph.addNode(rel.sourceTable, { moduleEn: '', moduleFr: '' });
      }
      if (!this.graph.hasNode(rel.targetTable)) {
        this.graph.addNode(rel.targetTable, { moduleEn: '', moduleFr: '' });
      }

      this.graph.addEdge(rel.sourceTable, rel.targetTable, {
        weight: rel.weight,
        sourceColumn: rel.sourceColumn,
        targetColumn: rel.targetColumn,
        relationshipType: rel.relationshipType,
      });
    }
  }

  findOptimalPath(
    sourceTable: string,
    targetTable: string,
  ): JoinPathResult | null {
    if (!this.graph.hasNode(sourceTable) || !this.graph.hasNode(targetTable)) {
      return null;
    }

    const pathNodes = dijkstra.bidirectional(
      this.graph,
      sourceTable,
      targetTable,
      'weight',
    );

    if (!pathNodes || pathNodes.length === 0) {
      return null;
    }

    let totalWeight = 0;
    const steps = [];

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const from = pathNodes[i];
      const to = pathNodes[i + 1];

      if (!from || !to) continue;

      const edgeKeys = this.graph.edges(from, to);
      if (edgeKeys.length === 0) continue;

      let bestEdgeKey = edgeKeys[0]!;
      let bestAttributes = this.graph.getEdgeAttributes(bestEdgeKey);

      for (const ek of edgeKeys) {
        const attrs = this.graph.getEdgeAttributes(ek);
        if (attrs['weight'] < bestAttributes['weight']) {
          bestEdgeKey = ek;
          bestAttributes = attrs;
        }
      }

      totalWeight += bestAttributes['weight'];
      steps.push({
        fromTable: from,
        fromColumn: bestAttributes['sourceColumn'],
        toTable: to,
        toColumn: bestAttributes['targetColumn'],
        weight: bestAttributes['weight'],
      });
    }

    return {
      path: pathNodes,
      totalWeight,
      steps,
    };
  }
}
