import * as Scene from '../scene';

describe(Scene.fromUrn, () => {
  it('throws error if scheme is not a urn', () => {
    expect(() => Scene.fromUrn('foo:123')).toThrow();
  });

  it('throws if nid is not vertexvis', () => {
    expect(() => Scene.fromUrn('urn:isbn')).toThrow();
  });

  it('throws if vertex scheme is not eedc', () => {
    expect(() => Scene.fromUrn('urn:vertexvis:foo')).toThrow();
  });

  it('parses URN for a scene', () => {
    const urn = 'urn:vertexvis:scene:123';
    const scene = Scene.fromUrn(urn);
    expect(scene).toEqual({
      type: 'scene',
      id: '123',
    });
  });
});
