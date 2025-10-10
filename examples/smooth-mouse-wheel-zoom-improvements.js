/**
 * Mouse Wheel Zoom Improvements Summary
 *
 * This example demonstrates the key improvements made to fix jumpy mouse wheel zoom:
 *
 * BEFORE:
 * - Mouse wheel events were artificially split into 5 separate interactions
 *   using SCROLL_WHEEL_DELTA_PERCENTAGES = [0.2, 0.15, 0.25, 0.25, 0.15]
 * - Each split created a separate begin/end interaction cycle
 * - No smoothing or accumulation of rapid wheel events
 * - 350ms debounce for interaction ending felt slow
 *
 * AFTER:
 * 1. Removed artificial delta splitting - single smooth operation per wheel event
 * 2. Added requestAnimationFrame batching for consistent frame-rate processing
 * 3. Added wheel delta accumulation with 16ms timeout (~60fps) for ultra-smooth zooming
 * 4. Reduced mouseWheelInteractionEndDebounce from 350ms to 150ms
 * 5. Added proper cleanup of accumulator timers
 *
 * KEY IMPROVEMENTS:
 *
 * BaseInteractionHandler.handleMouseWheel():
 * - Uses requestAnimationFrame batching like touch interactions
 * - Accumulates rapid wheel events into single operations
 * - Single interaction context instead of multiple micro-interactions
 *
 * ZoomInteraction.zoomToPoint():
 * - Accumulates deltas over 16ms windows
 * - Minimum threshold (0.1) prevents tiny irrelevant movements
 * - Proper timer management with cleanup
 *
 * Configuration:
 * - mouseWheelInteractionEndDebounce: 350ms → 150ms (more responsive)
 *
 * RESULT:
 * Mouse wheel zoom should now feel as smooth as two-finger drag or shift+drag zoom
 */

// Example of the new smooth wheel handling:
class ExampleSmoothWheelZoom {
  private pendingWheelZoom: { point: Point; delta: number } | null = null;
  private wheelAccumulator = 0;
  private wheelAccumulatorTimer: number | undefined;

  handleMouseWheel(event: WheelEvent): void {
    const delta = -this.wheelDeltaToPixels(event.deltaY, event.deltaMode) / 10;
    const point = this.getMousePosition(event);

    // Batch wheel input using requestAnimationFrame
    if (this.pendingWheelZoom) {
      this.pendingWheelZoom.delta += delta;
    } else {
      this.pendingWheelZoom = { point, delta };
      requestAnimationFrame(() => this.processWheelZoom());
    }
  }

  processWheelZoom(): void {
    if (this.pendingWheelZoom) {
      this.zoomToPoint(this.pendingWheelZoom.point, this.pendingWheelZoom.delta);
      this.pendingWheelZoom = null;
    }
  }

  zoomToPoint(point: Point, delta: number): void {
    // Accumulate rapid wheel events for smoothness
    this.wheelAccumulator += delta;

    if (this.wheelAccumulatorTimer) {
      clearTimeout(this.wheelAccumulatorTimer);
    }

    this.wheelAccumulatorTimer = window.setTimeout(() => {
      if (Math.abs(this.wheelAccumulator) > 0.1) {
        this.performZoom(point, this.wheelAccumulator);
      }
      this.wheelAccumulator = 0;
      this.wheelAccumulatorTimer = undefined;
    }, 16); // 60fps
  }
}