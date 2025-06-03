import { BoundingBox, Matrix4 } from '@vertexvis/geometry';
import { PropertyCategoryMap } from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import { UUID } from '@vertexvis/utils';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

import { ColorMaterial } from '../scenes/colorMaterial';
import { PagingLinks } from '../types';

export interface DomainPropertyKey {
  name: string;
  category: PropertyCategoryMap[keyof PropertyCategoryMap];
}

export interface TimestampDomainPropertyValue {
  type: 'timestamp';
  value: Timestamp.AsObject;
}

export interface StringDomainPropertyValue {
  type: 'string';
  value: string;
}

export interface LongDomainPropertyValue {
  type: 'long';
  value: number;
}

export interface DoubleDomainPropertyValue {
  type: 'double';
  value: number;
}

export type DomainPropertyValue =
  | StringDomainPropertyValue
  | LongDomainPropertyValue
  | DoubleDomainPropertyValue
  | TimestampDomainPropertyValue;

export interface DomainPropertyEntry {
  id: string;
  key?: DomainPropertyKey | null;
}
export interface SceneItemMetadataResponse {
  paging: PagingLinks;
  entries: DomainPropertyEntry[];
}

export interface ListSceneItemMetadataOptions {
  cursor?: string;
  size?: number;
}

export interface GetSceneViewItemOptions {
  includeBoundingBox?: boolean;
  includeWorldTransform?: boolean;
  includeMaterialOverride?: boolean;
}

export interface SceneViewItemMaterialOverride {
  defaultMaterial: ColorMaterial;
  colorMaterial: ColorMaterial;
}

export interface SceneViewItemOverride {
  id: UUID.UUID;
  createdAt: Date;
  transform?: Matrix4.Matrix4 | null;
  isVisible?: boolean | null;
  isSelected?: boolean | null;
  isPhantom?: boolean | null;
  endItem?: boolean | null;
  materialOverride?: SceneViewItemMaterialOverride | null;
}

export interface SceneViewItem {
  id: UUID.UUID;
  suppliedId?: string | null;
  name?: string | null;
  parentId: UUID.UUID;
  createdAt: Date;
  boundingBox?: BoundingBox.BoundingBox | null;
  override?: SceneViewItemOverride | null;
  worldTransform?: Matrix4.Matrix4 | null;
}
