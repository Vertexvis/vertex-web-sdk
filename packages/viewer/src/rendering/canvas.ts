import { FrameRenderer } from './renderer';
import { Frame } from '../types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Rectangle, Dimensions } from '@vertexvis/geometry';
import { Timing, TimingMeter } from '../metrics';
import { HtmlImage, loadImageBytes } from './imageLoaders';

const REPORTING_INTERVAL_MS = 1000;

export interface DrawFrame {
  dimensions: Dimensions.Dimensions;
  frame: Frame.Frame;
  image: HTMLImageElement | ImageBitmap;
  depth: HTMLImageElement | ImageBitmap | undefined;
}

export type CanvasRenderer = FrameRenderer<DrawFrame, DrawFrame>;

export type ReportTimingsCallback = (timing: Timing[]) => void;

function drawImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | ImageBitmap,
  data: DrawFrame
): void {
  const { imageAttributes } = data.frame;
  const imageRect = vertexvis.protobuf.stream.Rectangle.fromObject(
    imageAttributes.frameDimensions
  );
  const fitTo = Rectangle.fromDimensions(data.dimensions);
  const fit = Rectangle.containFit(fitTo, imageRect);

  const scaleX = fit.width / imageRect.width;
  const scaleY = fit.height / imageRect.height;

  const startXPos = imageAttributes.imageRect.x * scaleX;
  const startYPos = imageAttributes.imageRect.y * scaleY;

  context.clearRect(0, 0, data.dimensions.width, data.dimensions.height);
  context.drawImage(
    image,
    startXPos,
    startYPos,
    image.width * imageAttributes.scaleFactor * scaleX,
    image.height * imageAttributes.scaleFactor * scaleY
  );
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

export function measureCanvasRenderer<T>(
  meter: TimingMeter,
  renderer: FrameRenderer<T, DrawFrame>,
  logFrameRate: boolean,
  callback: ReportTimingsCallback,
  intervalMs: number = REPORTING_INTERVAL_MS
): FrameRenderer<T, DrawFrame> {
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

  return data => {
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

export function createCanvasRenderer(
  canvas: HTMLCanvasElement
): CanvasRenderer {
  const context = canvas.getContext('2d');
  if (context == null) {
    throw new Error('Could not create 2D canvas context.');
  }

  return async data => {
    drawImage(context, data.image, data);
    return data;
  };
}

export function createThreeJsRenderer(
  render: (data: DrawFrame) => void
): CanvasRenderer {
  return async data => {
    render(data);
    return data;
  };
}

export function composeRenderers(
  ...renderers: CanvasRenderer[]
): CanvasRenderer {
  return async data => {
    await Promise.all(renderers.map(r => r(data)));
    return data;
  };
}
