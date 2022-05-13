import { ShapeProps } from 'regl-shape';

export type DrawShape = (
  partialProps?: Partial<ShapeProps> | undefined
) => void;

export type CreateShape = (
  points: Float64Array,
  initialPartialProps?: Partial<ShapeProps> | undefined
) => DrawShape;
