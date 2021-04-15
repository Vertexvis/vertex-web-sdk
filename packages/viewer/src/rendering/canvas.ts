import { FrameRenderer } from './renderer';
import { Frame } from '../types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Rectangle, Dimensions, Point } from '@vertexvis/geometry';
import { Timing, TimingMeter } from '../metrics';
import { HtmlImage, loadImageBytes } from './imageLoaders';
import { DepthProvider } from './depth';
import { Camera, ImageScaleProvider } from '../scenes';

const REPORTING_INTERVAL_MS = 1000;

export interface DrawFrame {
  canvas: CanvasRenderingContext2D;
  dimensions: Dimensions.Dimensions;
  frame: Frame.Frame;
}

export type CanvasRenderer = FrameRenderer<DrawFrame, Frame.Frame>;

export type CanvasDepthProvider = DepthProvider<Point.Point>;

export type ReportTimingsCallback = (timing: Timing[]) => void;

function drawImage(image: HtmlImage, data: DrawFrame): void {
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

  data.canvas.clearRect(0, 0, data.dimensions.width, data.dimensions.height);
  data.canvas.drawImage(
    image.image,
    startXPos,
    startYPos,
    image.image.width * imageAttributes.scaleFactor * scaleX,
    image.image.height * imageAttributes.scaleFactor * scaleY
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
    const image = await loadImageBytes(data.frame.image);

    if (lastFrameNumber == null || frameNumber > lastFrameNumber) {
      lastFrameNumber = frameNumber;
      drawImage(image, data);
    }

    image.dispose();
    return data.frame;
  };
}

export function createCanvasDepthProvider(
  cameraProvider: () => Camera | undefined,
  imageScaleProvider: ImageScaleProvider,
  canvas?: CanvasRenderingContext2D | null
): CanvasDepthProvider {
  return (point) => {
    const { near, far } = cameraProvider() || {};
    if (canvas != null && near != null && far != null) {
      const scale = imageScaleProvider();
      const scaled = Point.scale(point, scale?.x || 1, scale?.y || 1);
      const data = canvas
        .getImageData(scaled.x, scaled.y, 1, 1)
        .data.slice(0, 3);

      const colorAvg =
        data.reduce((avg, component) => avg + component, 0) / data.length;

      return (colorAvg / 255) * (far - near);
    }
    return -1;
  };
}
