import { Point } from '@vertexvis/geometry';
import { EventDispatcher } from '@vertexvis/utils';
import { GestureRecognizer } from './recognizer';
import { GestureResolver } from './resolver';

export interface TapGestureRecognizerOptions {
  slop: number;
}

export class TapGestureRecognizer extends GestureRecognizer {
  public onTap = new EventDispatcher<PointerEvent>();

  private initialPosition?: Point.Point;
  private opts: TapGestureRecognizerOptions;

  public constructor(opts: Partial<TapGestureRecognizerOptions> = {}) {
    super();
    this.opts = { slop: opts.slop || 5 };
  }

  public gestureRejected(): void {
    window.removeEventListener('pointerup', this.handlePointerUp);
  }

  protected addAllowedPointer(
    event: PointerEvent,
    resolver: GestureResolver
  ): void {
    this.initialPosition = Point.create(event.clientX, event.clientY);

    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.isWithinSlop(event)) {
      this.onTap.emit(event);
    }
  };

  private isWithinSlop(event: PointerEvent): boolean {
    if (this.initialPosition != null) {
      const position = Point.create(event.clientX, event.clientY);
      const distance = Point.distance(this.initialPosition, position);
      return distance > this.opts.slop;
    } else {
      throw new Error('Invalid state. Initial position is undefined.');
    }
  }
}
