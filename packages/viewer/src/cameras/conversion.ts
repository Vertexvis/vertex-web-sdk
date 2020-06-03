import { Camera } from '@vertexvis/graphics3d';
import { vertexvis } from '@vertexvis/frame-stream-protos';

export function cameraToPlatform(
  camera: Camera.CameraPosition
): vertexvis.protobuf.stream.ICamera {
  return {
    position: camera.position,
    lookAt: camera.lookat,
    up: camera.upvector,
  };
}

export function cameraToEedc(
  camera: vertexvis.protobuf.stream.ICamera
): Camera.CameraPosition {
  return {
    position: {
      x: camera.position.x || 0,
      y: camera.position.y || 0,
      z: camera.position.z || 0,
    },
    lookat: {
      x: camera.lookAt.x || 0,
      y: camera.lookAt.y || 0,
      z: camera.lookAt.z || 0,
    },
    upvector: {
      x: camera.up.x || 0,
      y: camera.up.y || 0,
      z: camera.up.z || 0,
    },
  };
}
