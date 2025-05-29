import { PropertyCategoryMap } from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

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
