import * as UUID from '../uuid';

describe(UUID.create, () => {
  it('should return a v1 spec compliant UUID', () => {
    const uuid = UUID.create();
    expect(uuid).toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    );
  });
});
