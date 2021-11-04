import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { MetadataKey } from '../interfaces';

export type MetadataMap = Record<MetadataKey, string>;

export interface LoadedRow {
  index: number;
  node: Node.AsObject;
  metadata: MetadataMap;
  data: Record<string, unknown>;
}

export type Row = LoadedRow | undefined;

/* eslint-disable padding-line-between-statements */
export function fromNodeProto(
  index: number,
  node: Node,
  columns: MetadataKey[]
): Row;
export function fromNodeProto(
  index: number,
  nodes: Node[],
  columns: MetadataKey[]
): Row[];
export function fromNodeProto(
  index: number,
  nodes: Node | Node[],
  columns: MetadataKey[]
): Row | Row[] {
  if (Array.isArray(nodes)) {
    return nodes.map((node, i) => fromNodeProto(index + i, node, columns));
  } else {
    const node = nodes.toObject();
    return {
      index,
      node,
      metadata: makeMetadataMap(columns, node.columnsList),
      data: {},
    };
  }
}
/* eslint-enable padding-line-between-statements */

function makeMetadataMap(keys: MetadataKey[], values: string[]): MetadataMap {
  // if (keys.length !== values.length) {
  //   throw new Error('Column key length and column value length mismatch');
  // } else {
  return keys.reduce((map, key, i) => {
    map[key] = values[i] ?? '--';
    return map;
  }, {} as MetadataMap);
  // }
}

export function isLoadedRow(obj: unknown): obj is LoadedRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return obj != null && (obj as any).hasOwnProperty('node');
}
