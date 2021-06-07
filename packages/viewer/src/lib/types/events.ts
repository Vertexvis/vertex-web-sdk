export interface EventConfig {
  /**
   * The number of milliseconds after a single tap where a second tap will
   * trigger the "doubletap" event.
   */
  doubleTapThreshold: number;

  /**
   * The number of milliseconds that a tap or click has to be held down
   * before triggering the "longpress" event.
   */
  longPressThreshold: number;
}

export const defaultEventConfig: EventConfig = {
  doubleTapThreshold: 500,
  longPressThreshold: 500,
};
