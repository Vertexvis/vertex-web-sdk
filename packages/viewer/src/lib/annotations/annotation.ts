import type { Vector3 } from '@vertexvis/geometry';
import type { UUID } from '@vertexvis/utils';

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
  type: 'com.vertexvis.annotations.Callout';
  position: Vector3.Vector3;
  icon: CalloutAnnotationDataIcon;
}

export type CalloutAnnotationDataIcon = 'comment';

type AnnotationData = CalloutAnnotationData;
