import { Point } from '@vertexvis/geometry';

export interface TapEventDetails {
  position: Point.Point;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export type TapEventKeys = Pick<
  TapEventDetails,
  'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'
>;
