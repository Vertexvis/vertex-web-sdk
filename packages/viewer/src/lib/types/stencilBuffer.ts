import { Color, Disposable, EventDispatcher } from '@vertexvis/utils';
import { Dimensions, Point, Rectangle } from '@vertexvis/geometry';
import type { IDecodedPNG } from 'fast-png';
import { FrameImageLike } from './frame';
import { loadDecodePngWorker } from '../../workers';
import { mapStencilBufferOrThrow } from '../mappers';

export const stencilEmptyColor = Color.create(0, 0, 0);

export class StencilBufferManager {
  private dispatcher = new EventDispatcher<StencilBuffer | undefined>();
  private listenerCount = 0;

  private pendingStencilBuffer?: Promise<StencilBuffer | undefined>;

  public constructor(private viewer: HTMLVertexViewerElement) {
    viewer.addEventListener('frameReceived', this.invalidateStencilBuffer);
  }

  public latest(): Promise<StencilBuffer | undefined> {
    if (this.pendingStencilBuffer == null) {
      this.pendingStencilBuffer = this.fetchStencilBuffer();
    }
    return this.pendingStencilBuffer;
  }

  public register(
    listener: (buffer: StencilBuffer | undefined) => void
  ): Disposable {
    this.listenerCount = this.listenerCount + 1;
    this.dispatcher.on(listener);

    if (this.listenerCount === 1) {
      this.fetchStencilBuffer();
    }

    return { dispose: () => this.unregister(listener) };
  }

  private unregister(
    listener: (buffer: StencilBuffer | undefined) => void
  ): void {
    this.dispatcher.off(listener);
    this.listenerCount = this.listenerCount - 1;
  }

  private invalidateStencilBuffer = (): void => {
    this.pendingStencilBuffer = undefined;
  };

  private async fetchStencilBuffer(): Promise<StencilBuffer | undefined> {
    // TODO(dan): Make `isSceneReady` a prop.
    const isReady = await this.viewer.isSceneReady();
    const scene = isReady ? await this.viewer.scene() : undefined;
    const hasStencil =
      scene != null
        ? scene.crossSectioning().current().sectionPlanes.length > 0 ||
          this.viewer.featureLines != null
        : false;

    if (hasStencil) {
      const [res, { decodePng }] = await Promise.all([
        this.viewer.stream.getStencilBuffer(true),
        loadDecodePngWorker(),
      ]);

      const {
        stencilBuffer: stencilBytes,
        imageAttributes,
      } = mapStencilBufferOrThrow(res);

      const png = await decodePng(stencilBytes as Uint8Array);
      return StencilBuffer.fromPng(
        png,
        imageAttributes.frameDimensions,
        imageAttributes.imageRect,
        imageAttributes.scaleFactor
      );
    } else {
      return undefined;
    }
  }
}

export class StencilBuffer implements FrameImageLike {
  public constructor(
    public readonly frameDimensions: Dimensions.Dimensions,
    public readonly imageBytes: Uint8Array,
    public readonly imageChannels: number,
    public readonly imageRect: Rectangle.Rectangle,
    public readonly imageScale: number
  ) {}

  public static fromPng(
    png: Pick<IDecodedPNG, 'data' | 'channels'>,
    frameDimensions: Dimensions.Dimensions,
    imageRect: Rectangle.Rectangle,
    imageScale: number
  ): StencilBuffer {
    if (png.data instanceof Uint8Array) {
      return new StencilBuffer(
        frameDimensions,
        png.data,
        png.channels,
        imageRect,
        imageScale
      );
    } else {
      throw new Error('Expected stencil PNG to have depth of 8-bit');
    }
  }

  public getColor(pt: Point.Point): Color.Color | undefined {
    const { width, height } = this.imageRect;
    const offset = Point.subtract(pt, this.imageRect);
    const scale = 1 / this.imageScale;
    const pixel = Point.scale(offset, scale, scale);

    if (pixel.x >= 0 && pixel.y >= 0 && pixel.x < width && pixel.y < height) {
      const index = Math.floor(pixel.x) + Math.floor(pixel.y) * width;
      const offset = index * this.imageChannels;
      const r = this.imageBytes[offset + 0];
      const g = this.imageBytes[offset + 1];
      const b = this.imageBytes[offset + 2];
      const color = Color.create(r, g, b);
      return isEmptyColor(color) ? undefined : color;
    }
  }

  public getNearestPixel(
    pt: Point.Point,
    radius: number
  ): Point.Point | undefined {
    const diameter = radius * 2;
    const topLeft = Point.create(pt.x - radius, pt.y - radius);

    const pixels: Point.Point[] = [];

    for (let i = 0; i < diameter * diameter; i++) {
      const x = i % diameter;
      const y = Math.floor(i / diameter);
      const pixel = Point.add(topLeft, { x, y });

      if (Point.distance(pixel, pt) <= radius) {
        const color = this.getColor(pixel);
        if (color != null) {
          pixels.push(pixel);
        }
      }
    }

    const sorted = pixels.sort(
      (a, b) => Point.distance(a, pt) - Point.distance(b, pt)
    );
    return sorted[0];
  }
}

function isEmptyColor(color: Color.Color): boolean {
  return (
    color.r === stencilEmptyColor.r &&
    color.g === stencilEmptyColor.g &&
    color.b === stencilEmptyColor.b
  );
}
