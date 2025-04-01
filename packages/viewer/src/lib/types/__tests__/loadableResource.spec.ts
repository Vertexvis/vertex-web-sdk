import * as LoadableResource from '../loadableResource';

describe(LoadableResource.fromUrn, () => {
  it('throws error if scheme is not a urn', () => {
    expect(() => LoadableResource.fromUrn('foo:123')).toThrow();
  });

  it('throws if nid is not vertexvis', () => {
    expect(() => LoadableResource.fromUrn('urn:isbn')).toThrow();
  });

  it('throws if vertex scheme is not eedc', () => {
    expect(() => LoadableResource.fromUrn('urn:vertex:foo')).toThrow();
  });

  it('parses URN for a stream key', () => {
    const urn = 'urn:vertex:stream-key:123';
    const { resource } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
  });

  it('parses a sub resource for a scene view state by query param for a URN', () => {
    const urn = 'urn:vertex:stream-key:123?scene-view-state=234';
    const { resource, subResource } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
    expect(subResource).toEqual({ type: 'scene-view-state', id: '234' });
  });

  it('parses a sub resource for a scene view state for a URN', () => {
    const urn = 'urn:vertex:stream-key:123/scene-view-states/234';
    const { resource, subResource } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
    expect(subResource).toEqual({ type: 'scene-view-state', id: '234' });
  });

  it('parses query param for a URN', () => {
    const urn = 'urn:vertex:stream-key:123/scene-view-states?supplied-id=234';
    const { resource, subResource, queries } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
    expect(subResource).toEqual({ type: 'scene-view-state', id: undefined });
    expect(queries![0]).toEqual({ type: 'supplied-id', id: '234' });
  });

  it('parses multiple query params for a URN', () => {
    const urn =
      'urn:vertex:stream-key:123?supplied-id=234&supplied-id=345&supplied-id=456';
    const { resource, queries } = LoadableResource.fromUrn(urn);
    expect(resource).toEqual({ type: 'stream-key', id: '123' });
    expect(queries![0]).toEqual({ type: 'supplied-id', id: '234' });
    expect(queries![1]).toEqual({ type: 'supplied-id', id: '345' });
    expect(queries![2]).toEqual({ type: 'supplied-id', id: '456' });
  });
});
