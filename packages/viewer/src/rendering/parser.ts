import { FrameRenderer } from './renderer';
import { Frame } from '../types';
import { CanvasRenderer, DrawFrame } from './canvas';
import { HtmlImage, loadImageBytes } from './imageLoaders';

export type FrameParser = FrameRenderer<Frame.Frame, DrawFrame>;

export function parseFrame(renderer: CanvasRenderer): FrameParser {
  let lastFrameNumber: number | undefined;
  let lastImage: HtmlImage | undefined;
  let lastDepth: HtmlImage | undefined;

  return async frame => {
    const frameNumber = frame.sequenceNumber;
    const [image, depth] = await Promise.all([
      loadImageBytes(frame.image),
      frame.depth != null
        ? loadImageBytes(frame.depth)
        : Promise.resolve(undefined),
    ]);

    const drawFrame = {
      dimensions: frame.imageAttributes.frameDimensions,
      frame,
      image: image.image,
      depth: depth?.image,
    };

    if (lastFrameNumber == null || frameNumber > lastFrameNumber) {
      // TODO(dan): This behavior needs to be double checked. Might not be
      // disposing images at the correct time.
      lastImage?.dispose();
      lastDepth?.dispose();

      lastFrameNumber = frameNumber;
      lastImage = image;
      lastDepth = depth;

      await renderer(drawFrame);
    }

    return drawFrame;
  };
}
