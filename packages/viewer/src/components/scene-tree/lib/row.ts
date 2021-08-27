import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { ColumnKey } from '../interfaces';

export type ColumnMap = Record<ColumnKey, string>;

export interface LoadedRow {
  index: number;
  node: Node.AsObject;
  columns: ColumnMap;
  data: Record<string, unknown>;
}

export type Row = LoadedRow | undefined;

/* eslint-disable padding-line-between-statements */
export function fromNodeProto(
  index: number,
  node: Node,
  columns: ColumnKey[]
): Row;
export function fromNodeProto(
  index: number,
  nodes: Node[],
  columns: ColumnKey[]
): Row[];
export function fromNodeProto(
  index: number,
  nodes: Node | Node[],
  columns: ColumnKey[]
): Row | Row[] {
  if (Array.isArray(nodes)) {
    return nodes.map((node, i) => fromNodeProto(index + i, node, columns));
  } else {
    const node = nodes.toObject();
    return {
      index,
      node,
      columns: makeColumns(columns, node.columnsList),
      data: {},
    };
  }
}
/* eslint-enable padding-line-between-statements */

function makeColumns(keys: ColumnKey[], values: string[]): ColumnMap {
  if (keys.length !== values.length) {
    throw new Error('Column key length and column value length mismatch');
  } else {
    return keys.reduce((map, key, i) => {
      map[key] = values[i];
      return map;
    }, {} as ColumnMap);
  }
}

export function isLoadedRow(obj: unknown): obj is LoadedRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return obj != null && (obj as any).hasOwnProperty('node');
}
