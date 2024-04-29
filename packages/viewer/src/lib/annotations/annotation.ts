import type { Vector3 } from '@vertexvis/geometry';
import type { UUID } from '@vertexvis/utils';

import type { ViewerIconName } from '../../components/viewer-icon/viewer-icon';

export interface AnnotationSet {
  id: UUID.UUID;
  createdAt: Date;
  modifiedAt: Date;
  name?: string;
  suppliedId?: string;
}

export interface Annotation {
  id: UUID.UUID;
  createdAt: Date;
  modifiedAt: Date;
  data: AnnotationData;
  suppliedId?: string;
}

export interface CalloutAnnotationData {
  type: 'callout';
  position: Vector3.Vector3;
  icon?: ViewerIconName;
  primaryColor?: string;
  accentColor?: string;
}

export interface CustomAnnotationData {
  type: 'custom';
  jsonType: string;
  jsonData: Record<string, unknown>;
}

export type AnnotationData = CalloutAnnotationData | CustomAnnotationData;
