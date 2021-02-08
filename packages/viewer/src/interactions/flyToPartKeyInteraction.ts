import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';
import { KeyInteraction, KeyState } from './keyInteraction';
import { ConfigProvider } from '../config/config';
import { TapEventDetails } from './tapEventDetails';

export class FlyToPartKeyInteraction
  implements KeyInteraction<TapEventDetails> {
  public constructor(
    private stream: StreamApi,
    private configProvider: ConfigProvider
  ) {}

  public predicate(keyState: KeyState): boolean {
    return keyState['Meta'] || keyState['Control'];
  }

  public async fn(e: TapEventDetails): Promise<void> {
    const hitResult = await this.stream.hitItems(
      {
        point: e.position,
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
    }
  }
}
