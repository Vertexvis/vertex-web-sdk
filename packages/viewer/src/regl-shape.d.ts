declare module 'array-bounds' {
  export type Bounds = [number, number, number, number];
  const getBounds: (array: Float64Array, dimension: number) => Bounds;
  export default getBounds;
}

declare module 'array-normalize' {
  import { Bounds } from 'array-bounds';
  const normalize: (
    array: Float64Array,
    dimension: number,
    bounds: Bounds
  ) => void;
  export default normalize;
}

declare module 'color-normalize' {
  export type InputColor =
    | string
    | Float32Array
    | Uint8Array
    | number[]
    | number;
  const rgba: (color: InputColor, type: 'uint8') => Uint8Array;
  export default rgba;
}
