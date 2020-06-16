import * as Model from '../model';

describe(Model.fromEedcUrn, () => {
  it('throws error if scheme is not a urn', () => {
    expect(() => Model.fromEedcUrn('foo:123')).toThrow();
  });

  it('throws if nid is not vertexvis', () => {
    expect(() => Model.fromEedcUrn('urn:isbn')).toThrow();
  });

  it('throws if vertex scheme is not eedc', () => {
    expect(() => Model.fromEedcUrn('urn:vertexvis:foo')).toThrow();
  });

  it('throws if resource type is unknown', () => {
    expect(() => Model.fromEedcUrn('urn:vertexvis:eedc:foo')).toThrow();
  });

  it('parses URN for a model defined by scene state', () => {
    const urn = 'urn:vertexvis:eedc:scenestate:123';
    const model = Model.fromEedcUrn(urn);
    expect(model).toEqual({
      type: 'scenestate',
      sceneStateId: '123',
    });
  });

  it('parses URN for a model defined by vertex file id', () => {
    const urn = 'urn:vertexvis:eedc:file:123';
    const model = Model.fromEedcUrn(urn);
    expect(model).toEqual({
      type: 'file',
      fileId: '123',
    });
  });

  it('parses URN for a model defined by external file id', () => {
    const urn = 'urn:vertexvis:eedc:file?externalId=123';
    const model = Model.fromEedcUrn(urn);
    expect(model).toEqual({
      type: 'file',
      externalFileId: '123',
    });
  });
});
