// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';

import { Viewport } from '../../lib/types';

export type TransformWidgetInputPlacement =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface TransformWidgetInputProps {
  viewport: Viewport;
  point: Point.Point;
  placement: TransformWidgetInputPlacement;

  value?: number | string;

  onChange?: (value: number) => void | Promise<void>;
}

export const TransformWidgetInput: FunctionalComponent<
  TransformWidgetInputProps
> = ({ viewport, point, placement, value, onChange }) => {
  const inputPlacement = computeInputPlacement(
    viewport,
    Dimensions.create(100, 30),
    point,
    placement
  );

  const handleChange = (event: Event): void => {
    if (event.target != null) {
      const parsed = parseFloat((event.target as HTMLInputElement).value);

      if (!isNaN(parsed)) {
        onChange?.(parseFloat((event.target as HTMLInputElement).value));
      }
    }
  };

  return (
    <input
      style={{
        position: 'absolute',
        width: '100px',
        height: '30px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        ...inputPlacement,
      }}
      type="number"
      value={`${value}`}
      onChange={handleChange}
    ></input>
  );
};

function constrainTo(dimension: number, length: number): number {
  return Math.min(dimension, Math.max(0, length));
}

interface InputPlacement {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
}

function computeInputPlacement(
  viewport: Viewport,
  inputDimensions: Dimensions.Dimensions,
  point: Point.Point,
  placement: TransformWidgetInputPlacement
): InputPlacement {
  const { width, height } = viewport.dimensions;

  function toCssLength(length: number): string {
    return `${length}px`;
  }

  switch (placement) {
    case 'top-left':
      return {
        right: toCssLength(
          constrainTo(width - inputDimensions.width, width - point.x)
        ),
        bottom: toCssLength(
          constrainTo(height - inputDimensions.height, height - point.y)
        ),
      };
    case 'top-right':
      return {
        left: toCssLength(constrainTo(width - inputDimensions.width, point.x)),
        bottom: toCssLength(
          constrainTo(height - inputDimensions.height, height - point.y)
        ),
      };
    case 'bottom-left':
      return {
        right: toCssLength(
          constrainTo(width - inputDimensions.width, width - point.x)
        ),
        top: toCssLength(constrainTo(height - inputDimensions.height, point.y)),
      };
    case 'bottom-right':
    default:
      return {
        left: toCssLength(constrainTo(width - inputDimensions.width, point.x)),
        top: toCssLength(constrainTo(height - inputDimensions.height, point.y)),
      };
  }
}
