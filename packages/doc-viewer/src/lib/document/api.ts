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

      // Minimum values for the offset of the underlying content to keep it visible in the viewport.
      // In the case of a document with dimensions of { width: 100, height: 100 } and a viewport of { width: 50, height: 50 },
      // the minimum offset would be { x: -25, y: -25 }. Using this minimum offset, the viewport is "placed"
      // in the bottom right corner of the viewport, by shifting the content underneath up and to the left.
      const minimumOffsetX = Math.min(0, viewport.width - renderedWidth);
      const minimumOffsetY = Math.min(0, viewport.height - renderedHeight);

      // Maximum values for the offset of the underlying content to keep it visible in the viewport.
      // These values will always be 0, as this represents "placing" the viewport in the top left corner
      // of the document.
      const maximumOffsetX = 0;
      const maximumOffsetY = 0;

      return Point.create(Math.max(minimumOffsetX, Math.min(maximumOffsetX, offset.x)), Math.max(minimumOffsetY, Math.min(maximumOffsetY, offset.y)));
    }
    return offset;
  }

  public abstract dispose(): void;

  public abstract load(uri: string): Promise<void>;
  public abstract loadPage(pageNumber: number): Promise<void>;
}
