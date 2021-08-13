import { Color } from '@vertexvis/utils';
import { Dimensions, Point, Rectangle } from '@vertexvis/geometry';
import type { IDecodedPNG } from 'fast-png';
import { FrameImageLike } from './frame';
import { mapStencilBufferOrThrow } from '../mappers';
import { decodePng } from '../../workers/png-decoder-pool';

/**
 * A color that represents if a pixel does not contain a stencil value.
 */
export const STENCIL_BUFFER_EMPTY_COLOR = Color.create(0, 0, 0);

/**
 * The `StencilBufferManager` manages the stencil buffer state for the viewer.
 * Stencil buffers are represented as images and contain additional information
 * related to the rendered frame. Examples of information contained within a
 * stencil buffer include: cross section and feature edge positions.
 *
 * This class contains methods for fetching a stencil buffer for the currently
 * rendered frame, as well as helpers that components can use to get an
 * up-to-date stencil buffer after any interactions are performed.
 */
export class StencilBufferManager {
  private pendingStencilBuffer?: Promise<StencilBuffer | undefined>;
  private pendingInteractionFinished?: Promise<void>;
  private pendingInteractionFinishedResolver?: () => void;

  /**
   * Constructs a new stencil buffer manager.
   *
   * **Note:** This class is only intended to be constructed by a viewer.
   *
   * @param viewer The viewer for this manager.
   */
  public constructor(private viewer: HTMLVertexViewerElement) {
    viewer.addEventListener(
      'interactionStarted',
      this.handleInteractionStarted
    );
    viewer.addEventListener(
      'interactionFinished',
      this.handleInteractionFinished
    );
    viewer.addEventListener('frameReceived', () => {
      this.invalidateStencilBuffer();
    });
  }

  /**
   * Fetches a stencil buffer for the last rendered frame. Returns `undefined`
   * if the last frame does not have stencil information.
   */
  public async fetch(): Promise<StencilBuffer | undefined> {
    const isReady = await this.viewer.isSceneReady();
    const scene = isReady ? await this.viewer.scene() : undefined;
    const hasStencil =
      scene != null
        ? scene.crossSectioning().current().sectionPlanes.length > 0 ||
          this.viewer.featureLines != null
        : false;

    if (hasStencil && this.viewer.stream != null) {
      const res = await this.viewer.stream.getStencilBuffer(true);
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

  /**
   * Returns a promise that resolves with the last generated stencil buffer, or
   * fetches a new stencil buffer if the frame has changed since the last
   * stencil buffer was fetched. Because the stencil buffer is cached by the
   * manager, this method can be called multiple times without performing a
   * network request.
   *
   * @see {@link StencilBufferManager.latestAfterInteraction} to wait for
   * requesting a stencil buffer after an interaction has finished.
   */
  public latest(): Promise<StencilBuffer | undefined> {
    if (this.pendingStencilBuffer == null) {
      this.pendingStencilBuffer = this.fetch();
    }
    return this.pendingStencilBuffer;
  }

  /**
   * Returns a promise that resolves with the latest stencil buffer, once any
   * interaction is being performed. If no interaction is being performed, then
   * the promise will resolve immediately with the latest stencil buffer.
   *
   * This method is useful for components to fetch the most up-to-date stencil
   * buffer. Because the stencil buffer is cached by the manager, components can
   * call this method multiple times without performing a network request.
   *
   * @see {@link StencilBufferManager.latest} - used internally by this method.
   */
  public async latestAfterInteraction(): Promise<StencilBuffer | undefined> {
    await this.pendingInteractionFinished;
    return this.latest();
  }

  private handleInteractionStarted = (): void => {
    this.invalidateStencilBuffer();

    this.pendingInteractionFinished = new Promise((resolve) => {
      this.pendingInteractionFinishedResolver = resolve;
    });
  };

  private handleInteractionFinished = (): void => {
    this.pendingInteractionFinishedResolver?.();
    this.pendingInteractionFinished = undefined;
    this.pendingInteractionFinishedResolver = undefined;
  };

  private invalidateStencilBuffer = (): void => {
    this.pendingStencilBuffer = undefined;
  };
}

/**
 * Represents a stencil buffer that is managed by `StencilBufferManager`.
 *
 * @see {@link StencilBufferManager} for fetching a stencil buffer.
 */
export class StencilBuffer implements FrameImageLike {
  /**
   * Constructor.
   *
   * @param frameDimensions The dimensions of the frame.
   * @param imageBytes The PNG image data of the stencil buffer.
   * @param imageChannels The number of color channels.
   * @param imageRect The rectangle within the frame for this buffer.
   * @param imageScale The amount of scaling that was applied to fill the frame.
   */
  public constructor(
    public readonly frameDimensions: Dimensions.Dimensions,
    public readonly imageBytes: Uint8Array,
    public readonly imageChannels: number,
    public readonly imageRect: Rectangle.Rectangle,
    public readonly imageScale: number
  ) {}

  /**
   * Constructs a new stencil buffer from a decoded PNG.
   *
   * @param png The decoded PNG.
   * @param frameDimensions The dimensions of the frame.
   * @param imageChannels The number of color channels.
   * @param imageRect The rectangle within the frame for this buffer.
   * @param imageScale The amount of scaling that was applied to fill the frame.
   */
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

  /**
   * Returns the color at the given frame position.
   *
   * @param pt A position within the frame.
   * @returns A color at the given position, or `undefined` if the color matches
   * the stencil buffer's empty color.
   * @see {@link Viewport.transformPointToFrame} to convert a viewport position
   * to frame position.
   */
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

  /**
   * Returns the colored point that is nearest to the given `pt`. This method is
   * useful for performing snapping operations. An optional predicate can be
   * provided to filter the pixels that are evaluated.
   *
   * @param pt A position within the frame.
   * @param radius The radius around `pt` to evalute.
   * @param predicate An optional predicate. If unspecified, any non-black
   * pixels are considered.
   * @returns A point within radius that matches the given predicate.
   * @see {@link Viewport.transformPointToFrame} to convert a viewport position
   * to frame position.
   */
  public getNearestPixel(
    pt: Point.Point,
    radius: number,
    predicate: (color: Color.Color) => boolean = () => true
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
        if (color != null && predicate(color)) {
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
    color.r === STENCIL_BUFFER_EMPTY_COLOR.r &&
    color.g === STENCIL_BUFFER_EMPTY_COLOR.g &&
    color.b === STENCIL_BUFFER_EMPTY_COLOR.b
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function debugStencilBuffer(imageBytes: Uint8Array): Promise<void> {
  const blob = new Blob([imageBytes]);
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  context?.drawImage(bitmap, 0, 0);

  console.log(canvas.toDataURL());
}