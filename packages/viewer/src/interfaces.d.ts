import { Euler, Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';

export interface HTMLDomRendererPositionableElement {
  position: Vector3.Vector3;
  positionJson: string;
  rotation?: Euler.Euler;
  rotationJson?: string;
  quaternion: Quaternion.Quaternion;
  quaternionJson: string;
  scale: Vector3.Vector3;
  scaleJson: string;
  matrix: Matrix4.Matrix4;
}
