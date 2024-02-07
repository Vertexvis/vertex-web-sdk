import { Point, Rectangle } from '@vertexvis/geometry';
import { UUID } from '@vertexvis/utils';

import { LineAnchorStyle } from '../../components/viewer-markup-arrow/utils';

export interface ArrowMarkupInit {
  start?: Point.Point;
  end?: Point.Point;
  id?: string;
  startLineEndStyle?: LineAnchorStyle;
  endLineEndStyle?: LineAnchorStyle;
}

export class ArrowMarkup {
  public readonly start: Point.Point;
  public readonly end: Point.Point;
  public readonly id: string;
  public readonly startLineAnchorStyle: LineAnchorStyle;
  public readonly endLineAnchorStyle: LineAnchorStyle;

  public constructor(init: ArrowMarkupInit) {
    this.start = init.start ?? Point.create();
    this.end = init.end ?? Point.create();
    this.id = init.id ?? `arrow-markup--${UUID.create()}`;
    this.startLineAnchorStyle = init.startLineAnchorStyle ?? 'none';
    this.endLineAnchorStyle = init.endLineAnchorStyle ?? 'arrow-triangle';
  }
}

export interface CircleMarkupInit {
  bounds?: Rectangle.Rectangle;
  id?: string;
}

export class CircleMarkup {
  public readonly bounds: Rectangle.Rectangle;
  public readonly id: string;

  public constructor(init: CircleMarkupInit) {
    this.bounds = init.bounds ?? Rectangle.create(0, 0, 0, 0);
    this.id = init.id ?? `circle-markup--${UUID.create()}`;
  }
}

export interface FreeformMarkupInit {
  bounds?: Rectangle.Rectangle;
  points?: Point.Point[];
  id?: string;
}

export class FreeformMarkup {
  public readonly bounds: Rectangle.Rectangle;
  public readonly points: Point.Point[];
  public readonly id: string;

  public constructor(init: FreeformMarkupInit) {
    this.bounds = init.bounds ?? Rectangle.create(0, 0, 0, 0);
    this.points = init.points ?? [];
    this.id = init.id ?? `freeform-markup--${UUID.create()}`;
  }
}

export type Markup = ArrowMarkup | CircleMarkup | FreeformMarkup;
