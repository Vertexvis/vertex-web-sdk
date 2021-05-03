import { FlyToPartKeyInteraction } from '../flyToPartKeyInteraction';
import { StreamApi } from '@vertexvis/stream-api';
import { Config } from '../../config/config';
import { TapEventDetails } from '../tapEventDetails';
import { Point } from '@vertexvis/geometry';

describe(FlyToPartKeyInteraction, () => {
  const streamApi = new StreamApi();
  streamApi.hitItems = jest.fn(async () => ({
    hitItems: { hits: [{ itemId: { hex: 'item-id' } }] },
  }));
  streamApi.flyTo = jest.fn(async () => ({ flyTo: {} }));
  const flyToPartKeyInteraction = new FlyToPartKeyInteraction(
    streamApi,
    () => ({ animation: { durationMs: 500 } } as Config),
    () => Point.create(1, 1)
  );

  it('Returns true for its predicate with Command or Control pressed', () => {
    expect(
      flyToPartKeyInteraction.predicate({ ctrlKey: true } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPartKeyInteraction.predicate({ metaKey: true } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPartKeyInteraction.predicate({ altKey: true } as TapEventDetails)
    ).toBe(true);
  });

  it('Queries for hit results and fits to the item if present', async () => {
    const position = Point.create(1, 1);
    await flyToPartKeyInteraction.fn({ position } as TapEventDetails);

    expect(streamApi.hitItems).toHaveBeenCalledWith(
      expect.objectContaining({
        point: position,
      }),
      true
    );

    expect(streamApi.flyTo).toHaveBeenCalled();
  });
});
