import { Dimensions } from '@vertexvis/geometry';

import { Timing, TimingMeter } from '../meters';
import { StencilBufferManager, Viewport } from '../types';
import { Frame } from '../types/frame';
import { HtmlImage, loadImageBytes } from './imageLoaders';
import { FrameRenderer } from './renderer';

const REPORTING_INTERVAL_MS = 1000;

export interface DrawFrame {
  canvas: CanvasRenderingContext2D;
  canvasDimensions: Dimensions.Dimensions;
  frame: Frame;
  viewport: Viewport;
  loadPredicate?: () => boolean;
  drawPredicate?: () => boolean;
  beforeDraw?: VoidFunction;
}

export type CanvasRenderer = FrameRenderer<DrawFrame, Frame | undefined>;

export type ReportTimingsCallback = (timing: Timing[]) => void;

function drawImage(image: HtmlImage, data: DrawFrame): void {
  const rect = data.viewport.calculateDrawRect(data.frame.image);

  data.canvas.clearRect(
    0,
    0,
    data.canvasDimensions.width,
    data.canvasDimensions.height
  );
  data.canvas.drawImage(image.image, rect.x, rect.y, rect.width, rect.height);
}

function reportTimings(
  meter: TimingMeter,
  callback: ReportTimingsCallback
): void {
  const timings = meter.takeMeasurements();

  if (timings.length > 0) {
    callback(timings);
  }
}

export function measureCanvasRenderer(
  meter: TimingMeter,
  renderer: CanvasRenderer,
  logFrameRate: boolean,
  callback: ReportTimingsCallback,
  intervalMs: number = REPORTING_INTERVAL_MS
): CanvasRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let timer: any;
  let renderCount = 0;
  let fpsFrameCount: number | undefined;
  let fpsHistory: number[] = [];

  function start(): void {
    renderCount++;
    if (timer == null) {
      timer = setInterval(() => {
        reportTimings(meter, callback);
        if (renderCount === 0) {
          clearTimer();
        }
      }, intervalMs);
    }
  }

  function end(): void {
    renderCount--;
  }

  function clearTimer(): void {
    if (timer != null) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  /* istanbul ignore next */
  if (logFrameRate) {
    setInterval(() => {
      if (fpsFrameCount != null) {
        if (fpsHistory.length === 5) {
          fpsHistory = [...fpsHistory.slice(1), fpsFrameCount];
        } else {
          fpsHistory.push(fpsFrameCount);
        }

        const avgFps =
          fpsHistory.reduce((res, num) => res + num) / fpsHistory.length;
        console.debug(`Paint rate: ${fpsFrameCount}fps`);
        console.debug(`Paint rate (avg): ${avgFps}`);
        fpsFrameCount = undefined;
      }
    }, 1000);
  }

  return (data) => {
    start();
    return meter
      .measure(async () => {
        const frame = await renderer(data);
        fpsFrameCount = fpsFrameCount == null ? 1 : fpsFrameCount + 1;
        return frame;
      })
      .finally(() => end());
  };
}

export function createCanvasRenderer(): CanvasRenderer {
  let lastFrameNumber: number | undefined;

  return async (data) => {
    const frameNumber = data.frame.sequenceNumber;
    const frameIsNewer =
      lastFrameNumber == null || frameNumber > lastFrameNumber;
    const loadPredicatePassing = data.loadPredicate?.() ?? true;

    if (frameIsNewer && loadPredicatePassing) {
      const image = await loadImageBytes(data.frame.image.imageBytes);
      const drawPredicatePassing = data.drawPredicate?.() ?? true;

      lastFrameNumber = frameNumber;

      if (drawPredicatePassing) {
        data.beforeDraw?.();
        drawImage(image, data);
        image.dispose();
        return data.frame;
      } else {
        image.dispose();
      }
    }
  };
}

export function debugStencilBuffer(
  stencilManager: StencilBufferManager,
  drawStencil: () => boolean,
  renderer: CanvasRenderer
): CanvasRenderer {
  return async (data) => {
    const frame = await renderer(data);

    if (drawStencil()) {
      const stencil = await stencilManager.fetch();
      if (stencil != null) {
        const rect = data.viewport.calculateDrawRect(stencil);
        const stencilImage = await loadImageBytes(stencil.imageBytes);
        data.canvas.globalAlpha = 0.25;
        data.canvas.drawImage(
          stencilImage.image,
          rect.x,
          rect.y,
          rect.width,
          rect.height
        );
        data.canvas.globalAlpha = 1;
        stencilImage.dispose();
      }
    }

    return frame;
  };
}
