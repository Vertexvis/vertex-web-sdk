import { startStream } from '../streamCommands';
import { Dimensions } from '@vertexvis/geometry';
import {
  createHttpClientMock,
  createFrameStreamingClientMock,
} from '../../testing';
import { AuthToken } from '@vertexvis/vertex-api';
import { defaultConfig, Config } from '../../config/config';

describe('streamCommands', () => {
  const sceneId = '00000000-0000-0000-0000-000000000000';
  const httpClient = createHttpClientMock({ id: sceneId });
  const stream = createFrameStreamingClientMock();
  const credentialsProvider = (): AuthToken.AuthToken =>
    AuthToken.oauth2('client-id', 'token');
  const config = defaultConfig as Config;
  const dimensions = Dimensions.create(100, 100);

  describe('startStream', () => {
    it('starts a stream with the provided dimensions', async () => {
      await startStream(dimensions)({
        httpClient,
        stream,
        credentialsProvider,
        config,
      });

      expect(stream.startStream).toHaveBeenCalledWith({
        ...dimensions,
      });
    });
  });
});
