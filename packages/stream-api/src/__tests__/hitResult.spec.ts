import { vertexvis } from '@vertexvis/frame-streaming-protos';

import { decode, encode } from '../encoder';

describe('hit part revision instance ids', () => {
  const partInstanceId = '11111111-1111-1111-1111-111111111111';
  const leafPartInstanceId = '22222222-2222-2222-2222-222222222222';

  function hitMessage(
    hit: Record<string, unknown>,
  ): vertexvis.protobuf.stream.IStreamMessage {
    return {
      response: {
        hitItems: {
          hits: [hit as vertexvis.protobuf.stream.IHit],
        },
      },
    };
  }

  it('decodes instance ids on hit results', () => {
    const decoded = decode(
      encode(
        hitMessage({
          itemId: { hex: 'item-id' },
          leafItemId: { hex: 'leaf-item-id' },
          partInstanceId: { hex: partInstanceId },
          leafPartInstanceId: { hex: leafPartInstanceId },
        }),
      ),
    );

    const hit = decoded.response?.hitItems?.hits?.[0];
    expect(
      hit?.partInstanceId,
      'Hit.partInstanceId is field 14 on @vertexvis/frame-streaming-protos >= 0.18.13',
    ).toEqual({ hex: partInstanceId });
    expect(hit?.leafPartInstanceId).toEqual({ hex: leafPartInstanceId });
  });

  it('leaves instance ids unset for a root or geom surrogate hit', () => {
    const decoded = decode(
      encode(
        hitMessage({
          itemId: { hex: 'root-or-geom-surrogate' },
        }),
      ),
    );

    const hit = decoded.response?.hitItems?.hits?.[0];
    expect(hit?.partInstanceId ?? null).toBeNull();
    expect(hit?.leafPartInstanceId ?? null).toBeNull();
  });
});
