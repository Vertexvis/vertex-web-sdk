import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';
import { KeyInteraction } from './keyInteraction';
import { ConfigProvider } from '../config';
import { TapEventDetails } from './tapEventDetails';
import { ImageScaleProvider, Scene } from '../scenes';
import { Point, Vector3 } from '@vertexvis/geometry';

type SceneProvider = () => Scene;

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
    return !!e.altKey && !!e.shiftKey;
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
      const camera = this.sceneProvider().camera();
      const hit = hitResult.hitItems.hits[0];

      if (
        hit.hitPoint != null &&
        hit.hitPoint.x != null &&
        hit.hitPoint.y != null &&
        hit.hitPoint.z != null
      ) {
        await this.stream.flyTo({
          camera: camera
            .update({
              lookAt: Vector3.create(
                hit.hitPoint.x,
                hit.hitPoint.y,
                hit.hitPoint.z
              ),
            })
            .toFrameCamera(),
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
}
