import * as UUID from '../uuid';

describe(UUID.create, () => {
  it('should return a v1 spec compliant UUID', () => {
    const uuid = UUID.create();
    expect(uuid).toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    );
  });
});

describe(UUID.toMsbLsb, () => {
  it('should converts UUID string to MSB, LSB', () => {
    const uuid = 'b728aa62-76c0-4b25-9196-8e5445dc1309';
    const res = UUID.toMsbLsb(uuid);
    expect(res).toEqual({
      msb: '-5248758025824482523',
      lsb: '-7956015199102954743',
    });
  });
});
