import { Dimensions } from '@vertexvis/geometry';
import * as Camera from './camera';
import * as Lighting from './lighting';

export interface ScenePreferences {
  accumulationCount: number;
  imageQuality: number;
}

export interface Scene {
  viewport: Dimensions.Dimensions;
  camera: Camera.Camera;
  preferences: ScenePreferences;
  lights: Lighting.Lighting;
}

export const create = (
  camera: Camera.Camera,
  viewport: Dimensions.Dimensions
): Scene => {
  const preferences = { accumulationCount: 4, imageQuality: 80 };
  return normalize(
    positionLights({
      camera,
      viewport,
      preferences,
      lights: Lighting.create(),
    })
  );
};

export const positionLights = (scene: Scene): Scene => {
  const lighting = Lighting.fromCamera(scene.camera);
  return { ...scene, lights: lighting };
};

export const update = (data: Partial<Scene>, scene: Scene): Scene => {
  return normalize({ ...scene, ...data });
};

const normalize = (scene: Scene): Scene => {
  const camera = Camera.update(
    { aspect: Dimensions.aspectRatio(scene.viewport) },
    scene.camera
  );
  const viewport = Dimensions.round(scene.viewport);
  return { ...scene, camera, viewport };
};
