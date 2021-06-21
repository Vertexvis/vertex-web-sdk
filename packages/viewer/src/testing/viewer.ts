jest.mock('@vertexvis/stream-api');

import { currentDateAsProtoTimestamp } from '@vertexvis/stream-api';
import * as Fixtures from './fixtures';

interface LoadViewerOptions {
  jwt?: string;
  streamKey?: string;
  dispose?: () => void;
}

export async function loadModelForViewer(
  viewer: HTMLVertexViewerElement,
  { jwt, streamKey, dispose }: LoadViewerOptions = {}
): Promise<void> {
  const startStream = {
    startStream: {
      sceneViewId: { hex: 'scene-view-id' },
      streamId: { hex: 'stream-id' },
      jwt: jwt || 'jwt-value',
      worldOrientation: {
        front: { x: 0, y: 0, z: 1 },
        up: { x: 0, y: 1, z: 0 },
      },
    },
  };
  const syncTime = { syncTime: { replyTime: currentDateAsProtoTimestamp() } };
  const api = await viewer.getStream();
  (api.connect as jest.Mock).mockResolvedValue({
    dispose: () => {
      if (dispose != null) {
        dispose();
      }
      api.dispose();
    },
  });
  (api.startStream as jest.Mock).mockResolvedValue(startStream);
  (api.syncTime as jest.Mock).mockResolvedValue(syncTime);

  const loading = viewer.load(`urn:vertexvis:stream-key:${streamKey || 'key'}`);

  // Emit frame drawn on next event loop
  setTimeout(() => viewer.dispatchFrameDrawn(Fixtures.frame), 0);
  await loading;
}
