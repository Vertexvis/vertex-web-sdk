import { Camera } from '../camera';
import { Scene } from '../scene';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SceneMocks = jest.createMockFromModule('../../scenes') as any;

export const cameraMock = new SceneMocks.Camera() as Camera;

(cameraMock.fitToBoundingBox as jest.Mock).mockReturnValue(cameraMock);
(cameraMock.flyTo as jest.Mock).mockReturnValue(cameraMock);
(cameraMock.moveBy as jest.Mock).mockReturnValue(cameraMock);
(cameraMock.rotateAroundAxis as jest.Mock).mockReturnValue(cameraMock);
(cameraMock.standardView as jest.Mock).mockReturnValue(cameraMock);
(cameraMock.update as jest.Mock).mockReturnValue(cameraMock);
(cameraMock.viewAll as jest.Mock).mockReturnValue(cameraMock);

export const sceneMock = new SceneMocks.Scene() as Scene;

(sceneMock.camera as jest.Mock).mockReturnValue(cameraMock);
