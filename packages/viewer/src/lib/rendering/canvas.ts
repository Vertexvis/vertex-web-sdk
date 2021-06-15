import { FrameRenderer } from './renderer';
import { Dimensions, Point } from '@vertexvis/geometry';
import { Timing, TimingMeter } from '../meters';
import { HtmlImage, loadImageBytes } from './imageLoaders';
import { DepthProvider } from './depth';
import { Frame } from '../types/frame';
import { Viewport } from '../types';

const REPORTING_INTERVAL_MS = 1000;

export interface DrawFrame {
  canvas: CanvasRenderingContext2D;
  dimensions: Dimensions.Dimensions;
  frame: Frame;
  viewport: Viewport;
}

export interface DrawPixel {
  dimensions: Dimensions.Dimensions;
  frame: Frame;
  point: Point.Point;
}

export type CanvasRenderer = FrameRenderer<DrawFrame, Frame>;

export type CanvasDepthProvider = DepthProvider<DrawPixel>;

export type ReportTimingsCallback = (timing: Timing[]) => void;

function drawImage(image: HtmlImage, data: DrawFrame): void {
  const rect = data.viewport.calculateDrawRect(data.frame.image, image.image);

  data.canvas.clearRect(0, 0, data.dimensions.width, data.dimensions.height);
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
  let timer: number | undefined;
  let renderCount = 0;
  let fpsFrameCount: number | undefined;
  let fpsHistory: number[] = [];

  function start(): void {
    renderCount++;
    if (timer == null) {
      timer = window.setInterval(() => {
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
      window.clearInterval(timer);
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
    const image = await loadImageBytes(data.frame.image.data);

    if (lastFrameNumber == null || frameNumber > lastFrameNumber) {
      lastFrameNumber = frameNumber;
      drawImage(image, data);
    }

    image.dispose();
    return data.frame;
  };
}

export function createCanvasDepthProvider(): CanvasDepthProvider {
  return async (data) => {
    const depthBuffer = await data.frame.depthBuffer();
    if (depthBuffer != null) {
      const depth = depthBuffer.getNormalizedDepthAtPoint(data.point);
      return depth;
    }
    return -1;
  };
}
