import { Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import * as Camera from './camera';

export enum LightType {
  DirectionalLight = 'com.echo5.speedracer.render3d.avro.scene.lights.DirectionalLight',
}

export interface DirectionalLight {
  color: Color.Color;
  intensity: number;
  direction: Vector3.Vector3;
}

type Light = DirectionalLight;

export type Lighting = Array<Record<LightType, Light>>;

export const create = (): Lighting => {
  return [
    {
      [LightType.DirectionalLight]: directionalLight(),
    },
  ];
};

export const fromCamera = (camera: Camera.Camera): Lighting => {
  const position = Camera.translateScreenToWorld(camera, Point.create(50, 50));
  const direction = Vector3.subtract(
    camera.lookat,
    Vector3.add(position, camera.position)
  );

  return [{ [LightType.DirectionalLight]: directionalLight({ direction }) }];
};

export const directionalLight = (
  options: Partial<DirectionalLight> = {}
): DirectionalLight => {
  return {
    color: options.color || Color.create(1, 1, 1),
    intensity: options.intensity || 0.6,
    direction: options.direction || Vector3.back(),
  };
};
