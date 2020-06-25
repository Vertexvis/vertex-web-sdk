import { SceneBuilder, httpSceneBuilderExecutor } from '../sceneBuilder';
import { HttpRequest, HttpResponse } from '@vertexvis/poc-network';

describe(SceneBuilder, () => {
  const executor = jest.fn().mockReturnValue(Promise.resolve('resource'));

  beforeEach(() => executor.mockReset());

  describe(SceneBuilder.prototype.execute, () => {
    it('passes scene operations to executor', async () => {
      const builder = new SceneBuilder(executor);
      await builder
        .from('urn:some:resource')
        .show(s => s.withMetadata('key', 'value'))
        .execute();

      expect(executor).toHaveBeenCalledWith({
        resource: 'urn:some:resource',
        operations: expect.arrayContaining([
          expect.objectContaining({ operation: { type: 'show' } }),
        ]),
      });
    });

    it('throws error if resource is undefined', () => {
      expect(() => new SceneBuilder(executor).execute()).toThrow();
    });
  });
});

describe(httpSceneBuilderExecutor, () => {
  const request = HttpRequest.post({ url: '' });
  const response = HttpResponse.create({
    request,
    status: 200,
    body: JSON.stringify({ sceneStateId: 'scene-state-id' }),
  });
  const httpClient = jest.fn();

  beforeEach(() => httpClient.mockReset());

  it('performs a create scene state request', async () => {
    httpClient.mockResolvedValue(response);

    const executor = httpSceneBuilderExecutor(() => httpClient);
    const result = await executor({ resource: 'urn', operations: [] });

    expect(result).toEqual('urn:vertexvis:eedc:scenestate:scene-state-id');
    expect(httpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { id: 'urn', operations: [] },
      })
    );
  });
});
