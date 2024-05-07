import { BoundingSphere, Point, Vector3 } from '@vertexvis/geometry';
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
      const camera = (await this.sceneProvider()).camera();
      const hit = hitResult.hitItems.hits[0];

      if (
        hit.hitPoint != null &&
        hit.hitPoint.x != null &&
        hit.hitPoint.y != null &&
        hit.hitPoint.z != null
      ) {
        const newLookAt = Vector3.create(
          hit.hitPoint.x,
          hit.hitPoint.y,
          hit.hitPoint.z
        );

        // Check if orthographic
        if ((await this.sceneProvider()).isOrthographic()) {
          // Update the lookAt point to take the center of the model into account
          const updatedCenterPoint = Vector3.subtract(
            BoundingSphere.create((await this.sceneProvider()).boundingBox())
              .center,
            newLookAt
          );
          const orthogonalOffset = Vector3.dot(
            camera.viewVector,
            updatedCenterPoint
          );
          const viewVectorMagnitudeSquared = Vector3.magnitudeSquared(
            camera.viewVector
          );
          const offset = orthogonalOffset / viewVectorMagnitudeSquared;

          const scaledViewVector = Vector3.scale(offset, camera.viewVector);
          const updatedLookAt = Vector3.add(scaledViewVector, newLookAt);

          await this.stream.flyTo({
            camera: FrameCamera.toProtobuf(
              camera
                .update({
                  lookAt: updatedLookAt,
                  rotationPoint: updatedLookAt,
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
        }
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
}
