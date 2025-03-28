import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Mapper as M } from '@vertexvis/utils';

import { CameraType } from '../../interfaces';

export const toPbCameraType: M.Func<
  CameraType,
  vertexvis.protobuf.stream.CameraType
> = M.defineMapper(
  (cameraType) => {
    switch (cameraType) {
      case 'perspective':
        return vertexvis.protobuf.stream.CameraType.CAMERA_TYPE_PERSPECTIVE;
      case 'orthographic':
        return vertexvis.protobuf.stream.CameraType.CAMERA_TYPE_ORTHOGRAPHIC;
      default:
        return vertexvis.protobuf.stream.CameraType.CAMERA_TYPE_INVALID;
    }
  },
  (cameraType) => cameraType
);

export type CameraTypeEncoder = M.ThrowIfInvalidFunc<
  CameraType,
  vertexvis.protobuf.stream.CameraType
>;

export function toPbCameraTypeOrThrow(): CameraTypeEncoder {
  return M.ifInvalidThrow(toPbCameraType);
}
