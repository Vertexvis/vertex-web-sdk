import { BoundingBox, Point, Vector3 } from '@vertexvis/geometry';
import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';

import { ConfigProvider } from '../config';
import { ImageScaleProvider, Scene } from '../scenes';
import { FrameCamera } from '../types';
import { KeyInteraction } from './keyInteraction';
import { TapEventDetails } from './tapEventDetails';

type SceneProvider = () => Promise<Scene>;

export class FlyToPositionKeyInteraction
  implements KeyInteraction<TapEventDetails>
{
  public constructor(
    private stream: StreamApi,
    private configProvider: ConfigProvider,
    private imageScaleProvider: ImageScaleProvider,
    private sceneProvider: SceneProvider
  ) {}

  public predicate(e: TapEventDetails): boolean {
    return e.altKey && e.shiftKey;
  }

  public async fn(e: TapEventDetails): Promise<void> {
    const scale = this.imageScaleProvider();
    const hitResult = await this.stream.hitItems(
      {
        point: Point.scale(e.position, scale?.x || 1, scale?.y || 1),
      },
      true
    );

    if (
      hitResult.hitItems?.hits != null &&
      hitResult.hitItems.hits.length > 0 &&
      hitResult.hitItems.hits[0].hitPoint != null
    ) {
      const scene = await this.sceneProvider();
      const camera = (await this.sceneProvider()).camera();
      const hit = hitResult.hitItems.hits[0];

      if (
        hit.hitPoint != null &&
        hit.hitPoint.x != null &&
        hit.hitPoint.y != null &&
        hit.hitPoint.z != null
      ) {
        const hitPoint = Vector3.create(
          hit.hitPoint.x,
          hit.hitPoint.y,
          hit.hitPoint.z
        );
        const newLookAt = await this.getLookAtPoint(
          scene,
          hitPoint,
          camera.viewVector
        );

        await this.stream.flyTo({
          camera: FrameCamera.toProtobuf(
            camera
              .update({
                lookAt: newLookAt,
                rotationPoint: newLookAt,
              })
              .toFrameCamera()
          ),
          animation: {
            duration: toProtoDuration(
              this.configProvider().animation.durationMs
            ),
          },
        });
      } else {
        console.debug(
          `No hit position found for fly to position [position={x: ${e.position.x}, y: ${e.position.y}}, hit-id={${hit.itemId?.hex}}]`
        );
      }
    } else {
      console.debug(
        `No hit results found for fly to position [position={x: ${e.position.x}, y: ${e.position.y}}]`
      );
    }
  }

  protected getLookAtPoint(
    scene: Scene,
    hitPoint: Vector3.Vector3,
    viewVector: Vector3.Vector3
  ): Vector3.Vector3 {
    if (scene.isOrthographic()) {
      // Update the lookAt point to take the center of the model into account
      // This change helps ensure that the lookAt point is consistent between
      // the SDK and back-end system such that the calculated depth buffer is correct.

      const updatedCenterPoint = Vector3.subtract(
        BoundingBox.center(scene.boundingBox()),
        hitPoint
      );
      const orthogonalOffset = Vector3.dot(viewVector, updatedCenterPoint);
      const viewVectorMagnitudeSquared = Vector3.magnitudeSquared(viewVector);
      const offset = orthogonalOffset / viewVectorMagnitudeSquared;

      const scaledViewVector = Vector3.scale(offset, viewVector);
      return Vector3.add(scaledViewVector, hitPoint);
    } else {
      // For perspective, just return the hit point
      return hitPoint;
    }
  }
}
