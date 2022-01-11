import { Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { Config } from '../../config';
import { FlyToPartKeyInteraction } from '../flyToPartKeyInteraction';
import { TapEventDetails } from '../tapEventDetails';

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
      flyToPartKeyInteraction.predicate({
        ctrlKey: true,
        altKey: false,
      } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPartKeyInteraction.predicate({
        metaKey: true,
        altKey: false,
      } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPartKeyInteraction.predicate({ altKey: true } as TapEventDetails)
    ).toBe(true);
  });

  it('returns false for its predicate with Shift pressed', () => {
    expect(
      flyToPartKeyInteraction.predicate({
        altKey: true,
        shiftKey: true,
      } as TapEventDetails)
    ).toBe(false);
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
