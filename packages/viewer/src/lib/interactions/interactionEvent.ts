import { Dimensions, Point } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

/**
 * An `InteractionEvent` represents an event for when a user interacts with the
 * canvas of the viewer.
 */
export interface InteractionEvent {
  /**
   * A point within the coordinate space of the window where the user performed
   * an interaction.
   */
  screenPosition: Point.Point;

  /**
   * A point within the coordinate space of the rendered image where the user
   * performed an interaction.
   */
  canvasPosition?: Point.Point;

  /**
   * The dimensions of the canvas, in pixels.
   */
  canvasDimensions?: Dimensions.Dimensions;

  /**
   * The color (rgba) of the pixel where the user performed an interaction.
   */
  color?: Color.Color;

  /**
   * The mouse button that is pressed. See
   * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons.
   */
  button: number;
}

export interface ZoomInteractionEvent extends InteractionEvent {
  /**
   * The distance that the user zoomed.
   */
  delta: number;
}

export type BaseEvent = MouseEvent | PointerEvent;
