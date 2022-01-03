import { FlyToPositionKeyInteraction } from '../flyToPositionKeyInteraction';
import { StreamApi } from '@vertexvis/stream-api';
import { Config } from '../../config';
import { TapEventDetails } from '../tapEventDetails';
import { Point, Vector3 } from '@vertexvis/geometry';
import { Scene } from '../../scenes';
import { fromPbFrameOrThrow } from '../../mappers';
import { Orientation } from '../../types';
import * as ColorMaterial from '../../scenes/colorMaterial';
import { frame } from '../../../testing/fixtures';

describe(FlyToPositionKeyInteraction, () => {
  const streamApi = new StreamApi();
  streamApi.hitItems = jest.fn(async () => ({
    hitItems: {
      hits: [{ itemId: { hex: 'item-id' }, hitPoint: { x: 10, y: 20, z: 30 } }],
    },
  }));
  streamApi.flyTo = jest.fn(async () => ({ flyTo: {} }));
  const sceneViewId = 'scene-view-id';
  const scene = new Scene(
    streamApi,
    frame,
    fromPbFrameOrThrow(Orientation.DEFAULT),
    () => Point.create(1, 1),
    sceneViewId,
    ColorMaterial.fromHex('#ffffff')
  );
  const flyToPositionKeyInteraction = new FlyToPositionKeyInteraction(
    streamApi,
    () => ({ animation: { durationMs: 500 } } as Config),
    () => Point.create(1, 1),
    () => scene
  );

  it('returns true for its predicate with Alt and Shift pressed', () => {
    expect(
      flyToPositionKeyInteraction.predicate({
        ctrlKey: true,
      } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPositionKeyInteraction.predicate({
        metaKey: true,
      } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPositionKeyInteraction.predicate({ altKey: true } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPositionKeyInteraction.predicate({
        shiftKey: true,
      } as TapEventDetails)
    ).toBe(false);
    expect(
      flyToPositionKeyInteraction.predicate({
        altKey: true,
        shiftKey: true,
      } as TapEventDetails)
    ).toBe(true);
  });

  it('queries for hit results and sets the camera lookAt to the hit position', async () => {
    const position = Point.create(1, 1);
    await flyToPositionKeyInteraction.fn({ position } as TapEventDetails);

    expect(streamApi.hitItems).toHaveBeenCalledWith(
      expect.objectContaining({
        point: position,
      }),
      true
    );

    expect(streamApi.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          lookAt: Vector3.create(10, 20, 30),
        }),
      })
    );
  });
});
