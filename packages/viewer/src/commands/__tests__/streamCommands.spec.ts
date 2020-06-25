import { startStream } from '../streamCommands';
import { Dimensions } from '@vertexvis/geometry';
import { createFrameStreamingClientMock } from '../../testing';
import { defaultConfig, Config } from '../../config/config';
import { Token } from '../../credentials/token';

describe('streamCommands', () => {
  const stream = createFrameStreamingClientMock();
  const tokenProvider = (): Token => 'token';
  const config = defaultConfig as Config;
  const dimensions = Dimensions.create(100, 100);

  describe('startStream', () => {
    it('starts a stream with the provided dimensions', async () => {
      await startStream(dimensions)({
        stream,
        tokenProvider: tokenProvider,
        config,
      });

      expect(stream.startStream).toHaveBeenCalledWith({ ...dimensions });
    });
  });
});
