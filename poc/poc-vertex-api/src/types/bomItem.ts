import { UUID } from '@vertexvis/utils';

export interface BomItem {
  id: UUID.UUID;
  name: string;
}

export function create(data: Partial<BomItem> = {}): BomItem {
  return { id: UUID.create(), name: '', ...data };
}

export function fromJson(jsonObject: any): BomItem {
  return { id: jsonObject.id, name: jsonObject.name };
}
