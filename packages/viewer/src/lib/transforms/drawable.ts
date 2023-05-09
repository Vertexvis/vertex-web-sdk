import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import { JoinStyle, ShapeProps } from 'regl-shape';

import { CreateShape, DrawShape } from '../../lib/transforms/shape';
import { Viewport } from '../types';
import { flattenPointArray } from './util';

export interface DrawablePoints {
  valid: boolean;

  shortestDistanceFrom(vector: Vector3.Vector3): number;

  toWorldArray(): Vector3.Vector3[];
  toArray(): Point.Point[];
}

export abstract class Drawable<T extends DrawablePoints = DrawablePoints> {
  protected pointsArray: Float64Array;

  public initialFillColor?: string;

  public draw: DrawShape;

  public constructor(
    protected createShape: CreateShape,
    public identifier: string,
    public points: T,
    public outlineColor: string,
    public fillColor?: string,
    public shapeProps: Partial<ShapeProps> = {}
  ) {
    const pointsAsArray = points.toArray();

    this.pointsArray = new Float64Array(pointsAsArray.length * 2 + 4);
    flattenPointArray(pointsAsArray).forEach(
      (v, i) => (this.pointsArray[i] = v)
    );

    this.initialFillColor = fillColor;

    this.draw = createShape(this.pointsArray, {
      count: pointsAsArray.length,
      thickness: 2,
      join: 'rect' as JoinStyle,
      fill: this.fillColor,
      color: this.outlineColor,
      ...shapeProps,
    });
  }

  public updateFillColor(color?: Color.Color | string): void {
    if (color != null) {
      this.fillColor =
        typeof color === 'string' ? color : Color.toHexString(color);
    }
  }

  public updateOutlineColor(color?: Color.Color | string): void {
    if (color != null) {
      this.outlineColor =
        typeof color === 'string' ? color : Color.toHexString(color);
    }
  }

  public updatePoints(points?: T): void {
    if (points != null) {
      this.points = points;
      flattenPointArray(points.toArray()).forEach(
        (v, i) => (this.pointsArray[i] = v)
      );
    }
  }
}

export function computeDrawable2dBounds(
  viewport: Viewport,
  ...elements: Drawable[]
): Rectangle.Rectangle {
  let min = Point.create(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  let max = Point.create();

  elements
    .filter((m) => m.points.valid)
    .forEach((m) => {
      m.points
        .toArray()
        .map((pt) => viewport.transformNdcPointToViewport(pt))
        .forEach((pt) => {
          min = Point.create(Math.min(pt.x, min.x), Math.min(pt.y, min.y));
          max = Point.create(Math.max(pt.x, max.x), Math.max(pt.y, max.y));
        });
    });

  return Rectangle.fromPoints(min, max);
}
