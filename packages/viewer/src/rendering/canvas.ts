import { FrameRenderer } from './renderer';
import { Frame } from '../types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Rectangle, Dimensions, Point } from '@vertexvis/geometry';
import { Timing, TimingMeter } from '../metrics';
import { HtmlImage, loadImageBytes } from './imageLoaders';
import { DepthProvider } from './depth';

const REPORTING_INTERVAL_MS = 1000;

export interface DrawFrame {
  canvas: CanvasRenderingContext2D;
  dimensions: Dimensions.Dimensions;
  frame: Frame.Frame;
}

export interface DrawPixel extends DrawFrame {
  point: Point.Point;
}

export type CanvasRenderer = FrameRenderer<DrawFrame, Frame.Frame>;

export type CanvasDepthProvider = DepthProvider<DrawPixel>;

export type ReportTimingsCallback = (timing: Timing[]) => void;

interface FramePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

function drawImage(image: HtmlImage, data: DrawFrame): void {
  const position = getFramePosition(image, data.frame, data.dimensions);

  data.canvas.clearRect(0, 0, data.dimensions.width, data.dimensions.height);
  data.canvas.drawImage(
    image.image,
    position.x,
    position.y,
    position.width,
    position.height
  );
}

function drawPixel(image: HtmlImage, data: DrawPixel): void {
  const position = getFramePosition(image, data.frame, data.dimensions);

  data.canvas.clearRect(0, 0, 1, 1);
  data.canvas.drawImage(
    image.image,
    data.point.x - position.x,
    data.point.y - position.y,
    1,
    1,
    0,
    0,
    1,
    1
  );
}

function getFramePosition(
  image: HtmlImage,
  frame: Frame.Frame,
  dimensions: Dimensions.Dimensions
): FramePosition {
  const { imageAttributes } = frame;
  const imageRect = vertexvis.protobuf.stream.Rectangle.fromObject(
    imageAttributes.frameDimensions
  );
  const fitTo = Rectangle.fromDimensions(dimensions);
  const fit = Rectangle.containFit(fitTo, imageRect);

  const scaleX = fit.width / imageRect.width;
  const scaleY = fit.height / imageRect.height;

  return {
    x: imageAttributes.imageRect.x * scaleX,
    y: imageAttributes.imageRect.y * scaleY,
    width: image.image.width * imageAttributes.scaleFactor * scaleX,
    height: image.image.height * imageAttributes.scaleFactor * scaleY,
  };
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

export function createCanvasDepthProvider(): CanvasDepthProvider {
  return async (data) => {
    if (data.frame.depthBuffer != null) {
      const image = await loadImageBytes(data.frame.depthBuffer);

      drawPixel(image, data);
      image.dispose();

      const pixel = data.canvas.getImageData(0, 0, 1, 1).data.slice(0, 1);
      console.log(pixel);

      return pixel[0] / 255.0;
    }

    return -1;
  };
}
