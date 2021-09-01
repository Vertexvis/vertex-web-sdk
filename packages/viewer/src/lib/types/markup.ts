import { Point } from '@vertexvis/geometry';
import { UUID } from '@vertexvis/utils';

export interface ArrowMarkupInit {
  start?: Point.Point;
  end?: Point.Point;
  id?: string;
}

export class ArrowMarkup {
  public readonly start: Point.Point;
  public readonly end: Point.Point;
  public readonly id: string;

  public constructor(init: ArrowMarkupInit) {
    this.start = init.start ?? Point.create();
    this.end = init.end ?? Point.create();
    this.id = init.id ?? `measurement--${UUID.create()}`;
  }
}

export type Markup = ArrowMarkup;
