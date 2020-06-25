import * as SceneResource from '../sceneResource';

describe(SceneResource.fromUrn, () => {
  it('throws error if scheme is not a urn', () => {
    expect(() => SceneResource.fromUrn('foo:123')).toThrow();
  });

  it('throws if nid is not vertexvis', () => {
    expect(() => SceneResource.fromUrn('urn:isbn')).toThrow();
  });

  it('throws if vertex scheme is not eedc', () => {
    expect(() => SceneResource.fromUrn('urn:vertexvis:foo')).toThrow();
  });

  it('parses URN for a scene', () => {
    const urn = 'urn:vertexvis:scene:123';
    const scene = SceneResource.fromUrn(urn);
    expect(scene).toEqual({ type: 'scene', id: '123' });
  });
});
