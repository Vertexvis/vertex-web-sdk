export interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export const create = (x: number, y: number, z: number, w: number): Vector4 => {
  return { x, y, z, w };
};
