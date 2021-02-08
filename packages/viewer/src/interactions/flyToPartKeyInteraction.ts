import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';
import { KeyInteraction, KeyState } from './keyInteraction';
import { Point } from '@vertexvis/geometry';
import { ConfigProvider } from '../config/config';

export class FlyToPartKeyInteraction implements KeyInteraction<Point.Point> {
  public constructor(
    private stream: StreamApi,
    private configProvider: ConfigProvider
  ) {}

  public predicate(keyState: KeyState): boolean {
    return keyState['Meta'] || keyState['Control'];
  }

  public async fn(point: Point.Point): Promise<void> {
    const hitResult = await this.stream.hitItems(
      {
        point,
      },
      true
    );

    console.log(hitResult.hitItems?.hits);

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
    }
  }
}
