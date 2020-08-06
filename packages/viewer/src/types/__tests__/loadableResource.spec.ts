import * as LoadableResource from '../loadableResource';

describe(LoadableResource.fromUrn, () => {
  it('throws error if scheme is not a urn', () => {
    expect(() => LoadableResource.fromUrn('foo:123')).toThrow();
  });

  it('throws if nid is not vertexvis', () => {
    expect(() => LoadableResource.fromUrn('urn:isbn')).toThrow();
  });

  it('throws if vertex scheme is not eedc', () => {
    expect(() => LoadableResource.fromUrn('urn:vertexvis:foo')).toThrow();
  });

  it('parses URN for a stream key', () => {
    const urn = 'urn:vertexvis:stream-key:123';
    const scene = LoadableResource.fromUrn(urn);
    expect(scene).toEqual({ type: 'stream-key', id: '123' });
  });
});
