import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';

export interface LoadedRow {
  id: string;
  isLeaf: boolean;
  name: string;
  selected: boolean;
  expanded: boolean;
  visible: boolean;
  depth: number;
  suppliedId?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: object;
}

export type Row = LoadedRow | undefined;

/* eslint-disable padding-line-between-statements */
export function fromNodeProto(node: Node): Row;
export function fromNodeProto(nodes: Node[]): Row[];
export function fromNodeProto(nodes: Node | Node[]): Row | Row[] {
  if (Array.isArray(nodes)) {
    return nodes.map((node) => fromNodeProto(node));
  } else {
    return {
      id: nodes.getId()?.getHex() || '',
      expanded: nodes.getExpanded(),
      isLeaf: nodes.getIsLeaf(),
      name: nodes.getName(),
      selected: nodes.getSelected(),
      visible: nodes.getVisible(),
      depth: nodes.getDepth(),
      suppliedId: nodes.getSuppliedId()?.getValue(),
      data: {},
    };
  }
}
/* eslint-enable padding-line-between-statements */
