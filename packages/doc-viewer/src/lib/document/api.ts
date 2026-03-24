import { Dimensions, Point } from '@vertexvis/geometry';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

export const MAX_ZOOM_PERCENTAGE = 600;
export const MIN_ZOOM_PERCENTAGE = 10;

export interface DocumentApiState {
  readonly zoomPercentage: number;
  readonly viewport?: Dimensions.Dimensions;
  readonly contentDimensions?: Dimensions.Dimensions;
  readonly panOffset: Point.Point;
  readonly loadedPageNumber?: number;
}

/**
 * Base class for all document APIs. This class provides implementations for
 * operations common to all document types, such as viewport changes and loading
 * of pages.
 */
export abstract class DocumentApi<T extends DocumentApiState = DocumentApiState> {
  protected state: T;
  protected readonly stateChanged = new EventDispatcher<T>();

  public constructor(protected readonly defaultState: T) {
    this.state = defaultState;
  }

  protected updateState(state: Partial<T>): void {
    this.state = { ...this.defaultState, ...this.state, ...state };
    this.stateChanged.emit(this.state);
  }

  public onStateChanged(listener: Listener<T>): Disposable {
    return this.stateChanged.on(listener);
  }

  public async updateViewport(viewport: Dimensions.Dimensions): Promise<void> {
    if (this.state.viewport == null || !Dimensions.isEqual(this.state.viewport, viewport)) {
      this.updateState({ viewport } as Partial<T>);
    }
  }

  public async panByDelta(delta: Point.Point): Promise<void> {
    const panOffset = this.constrainPanOffset(Point.add(this.state.panOffset, delta), this.state.zoomPercentage);

    this.updateState({ panOffset } as Partial<T>);
  }

  public async zoomTo(percentage: number): Promise<void> {
    const { viewport, zoomPercentage, panOffset } = this.state;

    if (viewport != null) {
      const constrainedZoom = Math.min(Math.max(MIN_ZOOM_PERCENTAGE, percentage), MAX_ZOOM_PERCENTAGE);
      const zoomRatio = constrainedZoom / zoomPercentage;

      // Scale the center of the viewport by the updated zoom ratio to maintain the same center point.
      const scaledOffset = Point.add(Point.scaleProportional(Dimensions.center(viewport), 1 - zoomRatio), Point.scaleProportional(panOffset, zoomRatio));
      const constrainedOffset = this.constrainPanOffset(scaledOffset, constrainedZoom);

      this.updateState({ zoomPercentage: constrainedZoom, panOffset: constrainedOffset } as Partial<T>);
    } else {
      throw new Error('Viewport is not defined. Unable to perform zoom operation.');
    }
  }

  private constrainPanOffset(offset: Point.Point, zoomPercentage: number): Point.Point {
    const { viewport, contentDimensions } = this.state;

    if (viewport != null && contentDimensions != null) {
      // Constrain the offset based on the original content dimensions to prevent scenarios where
      // content winds up rendered outside of the viewport (i.e. the viewport shows as blank).
      const baseScale = Math.min(viewport.width / contentDimensions.width, viewport.height / contentDimensions.height);
      const renderedWidth = contentDimensions.width * baseScale * (zoomPercentage / 100);
      const renderedHeight = contentDimensions.height * baseScale * (zoomPercentage / 100);

      const minX = Math.min(0, viewport.width - renderedWidth);
      const maxX = Math.max(0, viewport.width - renderedWidth);
      const minY = Math.min(0, viewport.height - renderedHeight);
      const maxY = Math.max(0, viewport.height - renderedHeight);

      return Point.create(Math.max(minX, Math.min(maxX, offset.x)), Math.max(minY, Math.min(maxY, offset.y)));
    }
    return offset;
  }

  public abstract dispose(): void;

  public abstract load(uri: string): Promise<void>;
  public abstract loadPage(pageNumber: number): Promise<void>;
}
