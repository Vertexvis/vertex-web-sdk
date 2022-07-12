import { Dimensions } from '@vertexvis/geometry';

import { buildSceneOperation } from '../mapper';

describe(buildSceneOperation, () => {
  it('maps a clear transform operation', () => {
    expect(
      buildSceneOperation({ type: 'all' }, [{ type: 'clear-transform' }], {
        dimensions: Dimensions.create(100, 100),
      })
    ).toMatchObject({
      all: {},
      operationTypes: [
        {
          changeTransform: {},
        },
      ],
    });
  });
});
