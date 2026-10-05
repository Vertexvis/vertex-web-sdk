import type { Mock } from '../../../../../../vitest.mock-types';
import { PerspectiveCamera } from '../camera';
import { Scene } from '../scene';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SceneMocks = await vi.importMock<any>('../../scenes');

export const cameraMock =
  new SceneMocks.PerspectiveCamera() as PerspectiveCamera;

(cameraMock.fitToBoundingBox as Mock).mockReturnValue(cameraMock);
(cameraMock.flyTo as Mock).mockReturnValue(cameraMock);
(cameraMock.moveBy as Mock).mockReturnValue(cameraMock);
(cameraMock.rotateAroundAxis as Mock).mockReturnValue(cameraMock);
(cameraMock.standardView as Mock).mockReturnValue(cameraMock);
(cameraMock.standardViewFixedLookAt as Mock).mockReturnValue(cameraMock);
(cameraMock.update as Mock).mockReturnValue(cameraMock);
(cameraMock.viewAll as Mock).mockReturnValue(cameraMock);

export const sceneMock = new SceneMocks.Scene() as Scene;

(sceneMock.camera as Mock).mockReturnValue(cameraMock);
