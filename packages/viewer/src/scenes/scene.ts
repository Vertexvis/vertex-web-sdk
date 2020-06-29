import { StreamApi } from '@vertexvis/stream-api';
import { Frame } from '../types';
import { Camera } from './camera';
import { Dimensions } from '@vertexvis/geometry';

/**
 * A class that represents the `Scene` that has been loaded into the viewer. On
 * it, you can retrieve attributes of the scene, such as the camera. It also
 * contains methods for updating the scene and performing requests to rerender
 * the scene.
 */
export class Scene {
  public constructor(private stream: StreamApi, private frame: Frame.Frame) {}

  /**
   * An instance of the current camera of the scene.
   */
  public camera(): Camera {
    return new Camera(
      this.stream,
      Dimensions.aspectRatio(this.viewport()),
      this.frame.sceneAttributes.camera
    );
  }

  /**
   * The current viewport of the scene, in pixels.
   */
  public viewport(): Dimensions.Dimensions {
    return this.frame.imageAttributes.frameDimensions;
  }
}
