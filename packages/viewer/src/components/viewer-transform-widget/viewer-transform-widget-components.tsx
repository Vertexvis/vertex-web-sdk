// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';

import {
  AngleUnits,
  AngleUnitType,
  DistanceUnits,
  DistanceUnitType,
  Viewport,
} from '../../lib/types';

export type TransformWidgetInputPlacement =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface TransformWidgetInputProps {
  ref: (el?: HTMLInputElement) => void;
  bounds?: DOMRect;

  viewport: Viewport;
  point: Point.Point;
  placement: TransformWidgetInputPlacement;

  distance?: number;
  angle?: number;
  decimalPlaces: number;
  distanceUnit: DistanceUnitType;
  angleUnit: AngleUnitType;

  onChange?: (value: number) => void | Promise<void>;
  onIncrement?: VoidFunction;
  onDecrement?: VoidFunction;
}

export const TransformWidgetInput: FunctionalComponent<
  TransformWidgetInputProps
> = ({
  ref,
  bounds,
  viewport,
  point,
  placement,
  distance,
  angle,
  decimalPlaces,
  distanceUnit,
  angleUnit,
  onChange,
  onIncrement,
  onDecrement,
}) => {
  const angles = new AngleUnits(angleUnit);
  const units = new DistanceUnits(distanceUnit);
  const definedValue = distance ?? angle ?? 0;
  const displayValue = `${parseFloat(definedValue.toFixed(decimalPlaces))} ${
    distance != null ? units.unit.abbreviatedName : angles.unit.abbreviatedName
  }`;
  const inputPlacement = constrainInputToViewport(
    viewport,
    bounds ?? Dimensions.create(0, 0),
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

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowUp') {
      onIncrement?.();
    } else if (event.key === 'ArrowDown') {
      onDecrement?.();
    }
  };

  return (
    <div
      class="widget-input wrapper"
      style={{ ...inputPlacement }}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={ref}
        class="widget-input"
        type="text"
        value={displayValue}
        onChange={handleChange}
      ></input>
    </div>
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

function constrainInputToViewport(
  viewport: Viewport,
  inputDimensions: Dimensions.Dimensions,
  point: Point.Point,
  placement: TransformWidgetInputPlacement,
  padding = 5
): InputPlacement {
  const { width, height } = viewport.dimensions;
  const paddedWidth = inputDimensions.width + padding;
  const paddedHeight = inputDimensions.height + padding;

  function toCssLength(length: number): string {
    return `${length}px`;
  }

  switch (placement) {
    case 'top-left':
      return {
        right: toCssLength(constrainTo(width - paddedWidth, width - point.x)),
        bottom: toCssLength(
          constrainTo(height - paddedHeight, height - point.y)
        ),
      };
    case 'top-right':
      return {
        left: toCssLength(constrainTo(width - paddedWidth, point.x)),
        bottom: toCssLength(
          constrainTo(height - paddedHeight, height - point.y)
        ),
      };
    case 'bottom-left':
      return {
        right: toCssLength(constrainTo(width - paddedWidth, width - point.x)),
        top: toCssLength(constrainTo(height - paddedHeight, point.y)),
      };
    case 'bottom-right':
    default:
      return {
        left: toCssLength(constrainTo(width - paddedWidth, point.x)),
        top: toCssLength(constrainTo(height - paddedHeight, point.y)),
      };
  }
}
