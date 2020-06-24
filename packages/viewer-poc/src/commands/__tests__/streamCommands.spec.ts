import { loadModel } from '../streamCommands';
import { Dimensions } from '@vertexvis/geometry';
import {
  createHttpClientMock,
  createImageStreamingClientMock,
} from '../../testing';
import { AuthToken } from '@vertexvis/vertex-api-poc';
import { defaultConfig, Config } from '../../config/config';

describe('streamCommands', () => {
  const sceneStateId = '00000000-0000-0000-0000-000000000000';
  const httpClient = createHttpClientMock({ id: sceneStateId });
  const stream = createImageStreamingClientMock();
  const credentialsProvider = (): AuthToken.AuthToken =>
    AuthToken.oauth2('client-id', 'token');
  const config = defaultConfig as Config;
  const dimensions = Dimensions.create(100, 100);
  const baseUrn = 'urn:vertexvis:eedc';

  describe('loadModel', () => {
    it('loads a model provided', async () => {
      await loadModel(
        `${baseUrn}:file:00000000-0000-0000-0000-000000000000`,
        dimensions
      )({ httpClient, stream, credentialsProvider, config });

      expect(stream.loadSceneState).toHaveBeenCalledWith({
        type: 'scenestate',
        sceneStateId,
        dimensions,
      });
    });

    it('loads a scenestate', async () => {
      await loadModel(
        `${baseUrn}:scenestate:${sceneStateId}`,
        dimensions
      )({ httpClient, stream, credentialsProvider, config });

      expect(stream.loadSceneState).toHaveBeenCalledWith({
        type: 'scenestate',
        sceneStateId,
        dimensions,
      });
    });

    it('throws an exception if the file id is not provided', async () => {
      let exception;

      try {
        await loadModel(
          `${baseUrn}:file`,
          dimensions
        )({ httpClient, stream, credentialsProvider, config });
      } catch (e) {
        exception = e;
      }

      expect(exception).toBeInstanceOf(Error);
    });
  });
});
