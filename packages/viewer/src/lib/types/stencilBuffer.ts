import { Point } from '@vertexvis/geometry';
import type { DecodedPng } from 'fast-png';

import { decodePng } from '../../workers/png-decoder-pool';
import { fromPbStencilBufferOrThrow } from '../mappers';
import { DepthBuffer } from './depthBuffer';
import { FrameImageLike } from './frame';
import { ImageAttributesLike } from './frame';

/**
 * A value that represents if a pixel does not contain a stencil value.
 */
export const STENCIL_BUFFER_EMPTY_VALUE = 0;

/**
 * A value that represents if a pixel contains a feature.
 */
export const STENCIL_BUFFER_FEATURE_VALUE = 255;

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
    const camera = this.viewer.frame?.scene.camera;

    if (hasStencil && this.viewer.stream != null && camera != null) {
      const res = await this.viewer.stream.getStencilBuffer({
        includeDepthBuffer: true,
      });
      const {
        stencilBuffer: sBytes,
        depthBuffer: dBytes,
        imageAttributes,
      } = fromPbStencilBufferOrThrow(res);

      const [stencilPng, depthPng] = await Promise.all([
        decodePng(new Uint8Array(sBytes)),
        decodePng(new Uint8Array(dBytes)),
      ]);

      return StencilBuffer.fromPng(
        stencilPng,
        imageAttributes,
        sBytes,
        DepthBuffer.fromPng(depthPng, camera, imageAttributes)
      );
    } else return undefined;
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
   * @param imageAttr The attributes of the stencil image.
   * @param imageBytes The original bytes for the image of the stencil buffer.
   * @param pixelBytes The PNG pixel data of the stencil buffer.
   * @param imageChannels The number of color channels.
   * @param depthBuffer The depth buffer associated with this stencil buffer.
   */
  public constructor(
    public readonly imageAttr: ImageAttributesLike,
    public readonly imageBytes: Uint8Array,
    public readonly pixelBytes: Uint8Array,
    public readonly imageChannels: number,
    public readonly depthBuffer: DepthBuffer
  ) {}

  /**
   * Constructs a new stencil buffer from a decoded PNG.
   *
   * @param png The decoded PNG.
   * @param imageAttr The attributes of the stencil image.
   * * @param imageBytes The original bytes for the image of the stencil buffer.
   * @param depthBuffer The depth buffer associated with this stencil buffer.
   */
  public static fromPng(
    png: Pick<DecodedPng, 'data' | 'channels'>,
    imageAttr: ImageAttributesLike,
    imageBytes: Uint8Array,
    depthBuffer: DepthBuffer
  ): StencilBuffer {
    if (!(png.data instanceof Uint8Array)) {
      throw new Error('Expected stencil PNG to have depth of 8-bit');
    } else if (png.channels !== 1) {
      throw new Error('Expected stencil PNG to have 1 color channel');
    } else {
      return new StencilBuffer(
        imageAttr,
        imageBytes,
        png.data,
        png.channels,
        depthBuffer
      );
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
  public getValue(pt: Point.Point): number {
    const { width, height } = this.imageAttr.imageRect;
    const offset = Point.subtract(pt, this.imageAttr.imageRect);
    const scale = 1 / this.imageAttr.imageScale;
    const pixel = Point.scale(offset, scale, scale);

    if (pixel.x >= 0 && pixel.y >= 0 && pixel.x < width && pixel.y < height) {
      const index = Math.floor(pixel.x) + Math.floor(pixel.y) * width;
      const value = this.pixelBytes[index];
      return value;
    } else return 0;
  }

  /**
   * Performs a hit test of the given point. Returns `true` if the point hits a
   * pixel in the stencil.
   *
   * @param pt A point within the stencil's frame.
   * @returns `true` if the point hits a pixel in the stencil, `false`
   * otherwise.
   */
  public hitTest(pt: Point.Point): boolean {
    return this.getValue(pt) !== STENCIL_BUFFER_EMPTY_VALUE;
  }

  /**
   * Returns the colored pixel nearest to the given `pt`. This method is useful
   * for performing snapping operations. An optional predicate can be provided
   * to filter the pixels that are evaluated.
   *
   * @param pt A position within the frame.
   * @param radius The radius around `pt` to evaluate.
   * @param predicate An optional predicate. If unspecified, any non-black
   * pixels are considered.
   * @returns A point within radius that matches the given predicate.
   * @see {@link Viewport.transformPointToFrame} to convert a viewport position
   * to frame position.
   */
  public snapToNearestPixel(
    pt: Point.Point,
    radius: number,
    predicate: (value: number) => boolean = () => true
  ): Point.Point {
    const diameter = radius * 2;
    const topLeft = Point.create(pt.x - radius, pt.y - radius);

    const pixels: Point.Point[] = [];

    for (let i = 0; i < diameter * diameter; i++) {
      const x = i % diameter;
      const y = Math.floor(i / diameter);
      const pixel = Point.add(topLeft, { x, y });

      if (Point.distance(pixel, pt) <= radius) {
        const value = this.getValue(pixel);
        if (value === STENCIL_BUFFER_FEATURE_VALUE && predicate(value)) {
          pixels.push(pixel);
        }
      }
    }

    const sorted = pixels.sort(
      (a, b) => Point.distance(a, pt) - Point.distance(b, pt)
    );
    const closest = sorted[0];
    return closest != null
      ? Point.create(Math.floor(closest.x) + 0.5, Math.floor(closest.y) + 0.5)
      : pt;
  }
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
