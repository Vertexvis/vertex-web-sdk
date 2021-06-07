import { FrameRenderer } from './renderer';
import { Frame } from '../types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Rectangle, Dimensions, Point } from '@vertexvis/geometry';
import { Timing, TimingMeter } from '../meters';
import { HtmlImage, loadImageBytes } from './imageLoaders';
import { DepthProvider } from './depth';

const REPORTING_INTERVAL_MS = 1000;

export interface DrawFrame {
  canvas: CanvasRenderingContext2D;
  dimensions: Dimensions.Dimensions;
  frame: Frame.Frame;
}

export interface DrawPixel {
  dimensions: Dimensions.Dimensions;
  frame: Frame.Frame;
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

interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
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

function getPixel(image: HtmlImage, data: DrawPixel): Pixel {
  const position = getFramePosition(image, data.frame, data.dimensions);

  const canvas = window.document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  if (ctx != null) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.drawImage(
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

    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    return {
      r: pixel[0] || 0,
      g: pixel[1] || 0,
      b: pixel[2] || 0,
      a: pixel[3] || 0,
    };
  }

  return {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  };
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

      const pixel = getPixel(image, data);
      image.dispose();

      return pixel.r / 255.0;
    }

    return -1;
  };
}
