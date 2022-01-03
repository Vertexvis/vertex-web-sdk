import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';
import { KeyInteraction } from './keyInteraction';
import { ConfigProvider } from '../config';
import { TapEventDetails } from './tapEventDetails';
import { ImageScaleProvider } from '../scenes';
import { Point } from '@vertexvis/geometry';

export class FlyToPartKeyInteraction
  implements KeyInteraction<TapEventDetails>
{
  public constructor(
    private stream: StreamApi,
    private configProvider: ConfigProvider,
    private imageScaleProvider: ImageScaleProvider
  ) {}

  public predicate(e: TapEventDetails): boolean {
    return !!e.altKey && !e.shiftKey;
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
      hitResult.hitItems.hits.length > 0
    ) {
      await this.stream.flyTo({
        itemId: hitResult.hitItems.hits[0].itemId,
        animation: {
          duration: toProtoDuration(this.configProvider().animation.durationMs),
        },
      });
    } else {
      console.debug(
        `No hit results found for fly to part [position={x: ${e.position.x}, y: ${e.position.y}}]`
      );
    }
  }
}
