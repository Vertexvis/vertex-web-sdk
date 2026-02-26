import { Color } from '@vertexvis/utils';

import { makeRGBAi } from '../../../testing/colors';
import { fromPbRGBAi } from '../color';

describe(fromPbRGBAi, () => {
  it('returns mapped rgba values', () => {
    const expected = Color.create(50, 100, 150, 200);
    const color = makeRGBAi(expected);

    expect(fromPbRGBAi(color.toObject())).toMatchObject(expected);
  });
});
