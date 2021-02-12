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
    const { resource } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
  });

  it('parses query param for a URN', () => {
    const urn = 'urn:vertexvis:stream-key:123?scene-view-state=234';
    const { resource, queries } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
    expect(queries![0]).toEqual({ type: 'scene-view-state', id: '234' });
  });

  it('parses multiple query params for a URN', () => {
    const urn =
      'urn:vertexvis:stream-key:123?scene-view-state=234&scene-view-state=345&scene-view-state=456';
    const { resource, queries } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
    expect(queries![0]).toEqual({ type: 'scene-view-state', id: '234' });
    expect(queries![1]).toEqual({ type: 'scene-view-state', id: '345' });
    expect(queries![2]).toEqual({ type: 'scene-view-state', id: '456' });
  });
});
