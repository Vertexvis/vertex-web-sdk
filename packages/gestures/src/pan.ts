import { Disposable, EventDispatcher } from '@vertexvis/utils';
import { GestureRecognizer } from './recognizer';
import { GestureResolver } from './resolver';

export class PanGestureRecognizer extends GestureRecognizer {
  public onStart = new EventDispatcher<PointerEvent>();
  public onUpdate = new EventDispatcher<PointerEvent>();
  public onEnd = new EventDispatcher<PointerEvent>();

  private pointerMoveDisposable?: Disposable;
  private pointerUpDisposable?: Disposable;

  private onStartEvent?: PointerEvent;

  public constructor() {
    super();
  }

  public gestureAccepted(): void {
    if (this.onStartEvent != null) {
      this.onStart.emit(this.onStartEvent);
      this.onStartEvent = undefined;
    }
  }

  public gestureRejected(): void {
    this.pointerMoveDisposable?.dispose();
    this.pointerUpDisposable?.dispose();
  }

  protected addAllowedPointer(
    event: PointerEvent,
    resolver: GestureResolver
  ): void {
    this.pointerMoveDisposable = this.createWindowEventHandler(
      'pointermove',
      this.pointerMoveHandler(resolver)
    );
    this.pointerUpDisposable = this.createWindowEventHandler(
      'pointerup',
      this.handlePointerUp
    );
  }

  private pointerMoveHandler(
    resolver: GestureResolver
  ): (event: PointerEvent) => void {
    return (event) => {
      if (this.onStartEvent != null) {
        this.onStartEvent = event;
        resolver.accept();
      } else {
        this.onUpdate.emit(event);
      }
    };
  }

  private handlePointerUp(event: PointerEvent): void {
    this.onUpdate.emit(event);
  }
}
