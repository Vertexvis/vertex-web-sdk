import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';

export interface LoadedRow {
  index: number;
  node: Node.AsObject;
  data: Record<string, unknown>;
}

export type Row = LoadedRow | undefined;

/* eslint-disable padding-line-between-statements */
export function fromNodeProto(index: number, node: Node): Row;
export function fromNodeProto(index: number, nodes: Node[]): Row[];
export function fromNodeProto(
  index: number,
  nodes: Node | Node[]
): Row | Row[] {
  if (Array.isArray(nodes)) {
    return nodes.map((node, i) => fromNodeProto(index + i, node));
  } else {
    return {
      index,
      node: nodes.toObject(),
      data: {},
    };
  }
}
/* eslint-enable padding-line-between-statements */

export function isLoadedRow(obj: unknown): obj is LoadedRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return obj != null && (obj as any).hasOwnProperty('node');
}
