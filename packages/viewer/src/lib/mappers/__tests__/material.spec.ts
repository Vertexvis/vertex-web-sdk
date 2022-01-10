import { Color } from '@vertexvis/utils';

import { toPbRGBi } from '../material';

describe(toPbRGBi, () => {
  it('returns rgbi for hex string', () => {
    const res = toPbRGBi('#ff0000');
    expect(res).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns error if hex is invalid', () => {
    const res = toPbRGBi('asdqwe');
    expect(res).toMatchObject({ errors: expect.anything() });
  });

  it('returns rgbi for number', () => {
    const res = toPbRGBi(0xff0000);
    expect(res).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns rgbi for color', () => {
    const res = toPbRGBi(Color.create(255, 0, 0));
    expect(res).toEqual({ r: 255, g: 0, b: 0 });
  });
});
