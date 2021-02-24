jest.mock('../viewer');

import { Viewer } from '../viewer';
import { Scene } from '../../../scenes';

export * from '../../../scenes/__mocks__/mocks';

export let awaitScene: Promise<void> | undefined = undefined;

export let resolveScene: (() => void) | undefined = undefined;

export const viewer = new Viewer();

export function resetAwaiter(scene: Scene): void {
  (viewer.scene as jest.Mock).mockImplementation(() => {
    if (resolveScene) {
      resolveScene();
    }
    return Promise.resolve(scene);
  });

  awaitScene = new Promise(resolve => {
    resolveScene = resolve;
  });
}
