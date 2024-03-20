// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';

import { AngleUnits, DistanceUnits, Viewport } from '../../lib/types';

export type TransformWidgetInputPlacement =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface TransformWidgetInputWrapperProps {
  ref: (el?: HTMLDivElement) => void;
  bounds?: DOMRect;

  viewport: Viewport;
  point: Point.Point;
  placement: TransformWidgetInputPlacement;

  displayUnit: DistanceUnits | AngleUnits;
}

export const TransformWidgetInputWrapper: FunctionalComponent<
  TransformWidgetInputWrapperProps
> = ({ ref, bounds, viewport, point, placement, displayUnit }, children) => {
  const inputPlacement = constrainInputToViewport(
    viewport,
    bounds ?? Dimensions.create(0, 0),
    point,
    placement
  );

  return (
    <div
      ref={ref}
      class="widget-input wrapper"
      style={{
        ...inputPlacement,
        height: bounds?.height != null ? `${bounds.height}px` : undefined,
      }}
    >
      {children}
      <div class="widget-input units">{displayUnit.unit.abbreviatedName}</div>
    </div>
  );
};

export interface TransformWidgetInputProps {
  ref: (el?: HTMLInputElement) => void;

  identifier?: string;
  disabled?: boolean;

  onChange?: (value: number) => void | Promise<void>;
  onIncrement?: VoidFunction;
  onDecrement?: VoidFunction;
  onBlur?: VoidFunction;
  onUndo?: VoidFunction;
}

export const TransformWidgetInput: FunctionalComponent<
  TransformWidgetInputProps
> = ({
  ref,
  identifier,
  disabled,
  onChange,
  onIncrement,
  onDecrement,
  onBlur,
  onUndo,
}) => {
  const handleChange = (event: Event): void => {
    if (event.target != null) {
      const parsed = parseFloat((event.target as HTMLInputElement).value);

      if (!isNaN(parsed)) {
        onChange?.(parseFloat((event.target as HTMLInputElement).value));
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    const commandOrControlModifier = event.ctrlKey || event.metaKey;

    if (event.key === 'ArrowUp') {
      onIncrement?.();
    } else if (event.key === 'ArrowDown') {
      onDecrement?.();
    } else if (event.key === 'z' && commandOrControlModifier) {
      event.preventDefault();

      onUndo?.();
    }
  };

  return (
    <input
      ref={ref}
      disabled={disabled}
      class={`widget-input ${identifier}`}
      type="text"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
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
