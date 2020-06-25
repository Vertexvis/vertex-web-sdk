import * as Model from '../model';

describe(Model.fromUrn, () => {
  it('throws error if scheme is not a urn', () => {
    expect(() => Model.fromUrn('foo:123')).toThrow();
  });

  it('throws if nid is not vertexvis', () => {
    expect(() => Model.fromUrn('urn:isbn')).toThrow();
  });

  it('throws if vertex scheme is not eedc', () => {
    expect(() => Model.fromUrn('urn:vertexvis:foo')).toThrow();
  });

  it('throws if resource type is unknown', () => {
    expect(() => Model.fromUrn('urn:vertexvis:eedc:foo')).toThrow();
  });

  it('parses URN for a model defined by scene state', () => {
    const urn = 'urn:vertexvis:eedc:scenestate:123';
    const model = Model.fromUrn(urn);
    expect(model).toEqual({
      type: 'scenestate',
      sceneStateId: '123',
    });
  });

  it('parses URN for a model defined by vertex file id', () => {
    const urn = 'urn:vertexvis:eedc:file:123';
    const model = Model.fromUrn(urn);
    expect(model).toEqual({
      type: 'file',
      fileId: '123',
    });
  });

  it('parses URN for a model defined by external file id', () => {
    const urn = 'urn:vertexvis:eedc:file?externalId=123';
    const model = Model.fromUrn(urn);
    expect(model).toEqual({
      type: 'file',
      externalFileId: '123',
    });
  });
});
