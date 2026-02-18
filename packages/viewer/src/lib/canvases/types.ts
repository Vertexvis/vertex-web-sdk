import { Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

export interface CanvasDocument {
  items: Array<
    LineItem2d | OvalItem2d | FreeformItem2d | PinItem2d | CalloutItem
  >;
}

export interface StrokeStyle {
  thickness: number;
  color: Color.Color | string;
}

export interface FillStyle {
  color: Color.Color | string;
}

export interface ArrowEndShape {
  type: 'arrow-end';
  width: number;
  filled: boolean;
}

export interface CircleEndShape {
  type: 'circle-end';
  diameter: number;
  filled: boolean;
}

export interface DashEndShape {
  type: 'dash-end';
  width: number;
}

export interface LineItem2d {
  type: 'line-2d';
  startPosition: Point.Point;
  endPosition: Point.Point;
  startShape?: ArrowEndShape | CircleEndShape | DashEndShape;
  endShape?: ArrowEndShape | CircleEndShape | DashEndShape;
  stroke?: StrokeStyle;
  fill?: FillStyle;
}

export interface OvalItem2d {
  type: 'oval-2d';
  topLeftPosition: Point.Point;
  bottomRightPosition: Point.Point;
  stroke?: StrokeStyle;
  fill?: FillStyle;
}

export interface FreeformItem2d {
  type: 'freeform-2d';
  positions: Point.Point[];
  stroke?: StrokeStyle;
  fill?: FillStyle;
}

export interface CalloutItem {
  type: 'callout';
  primaryColor: Color.Color | string;
  accentColor: Color.Color | string;
  text: string;
  anchorPosition: Vector3.Vector3;
  textPosition: Point.Point;
  sceneItemId?: string;
}

export interface PinItem2d {
  type: 'pin-2d';
  primaryColor: Color.Color | string;
  accentColor: Color.Color | string;
  position: Vector3.Vector3;
  sceneItemId?: string;
}
