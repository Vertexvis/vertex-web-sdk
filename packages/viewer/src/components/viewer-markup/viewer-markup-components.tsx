// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point, Angle, Rectangle } from '@vertexvis/geometry';
import { getBoundingBox2dAnchorPosition } from './utils';

interface BoundingBoxAnchorProps {
  center: Point.Point;
  angle?: number;
  onGrab?: (event: PointerEvent) => void;
}

const BoundingBoxAnchor: FunctionalComponent<BoundingBoxAnchorProps> = ({
  angle,
  center,
  onGrab,
}) => {
  return (
    <rect
      class="bounds-rect"
      fill="#ffffff"
      height={8}
      width={8}
      x={center.x - 4}
      y={center.y - 4}
      transform={angle ? `rotate(${angle},${center.x},${center.y})` : undefined}
      onPointerDown={onGrab}
    />
  );
};

export interface BoundingBox1dProps {
  start: Point.Point;
  end: Point.Point;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onCenterAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}

export const BoundingBox1d: FunctionalComponent<BoundingBox1dProps> = ({
  start,
  end,
  onStartAnchorPointerDown,
  onCenterAnchorPointerDown,
  onEndAnchorPointerDown,
}) => {
  const angle = Angle.normalize(
    Angle.toDegrees(Angle.fromPoints(start, end)) - 270
  );
  const center = Point.create((start.x + end.x) / 2, (start.y + end.y) / 2);

  return (
    <g>
      <line
        class="bounds-line"
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
      />
      <BoundingBoxAnchor
        center={start}
        angle={angle}
        onGrab={onStartAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={end}
        angle={angle}
        onGrab={onEndAnchorPointerDown}
      />
      <circle
        class="bounds-circle"
        cx={center.x}
        cy={center.y}
        r={4}
        onPointerDown={onCenterAnchorPointerDown}
      />
    </g>
  );
};

export interface BoundingBox2dProps {
  bounds: Rectangle.Rectangle;
  onTopLeftAnchorPointerDown?: (event: PointerEvent) => void;
  onLeftAnchorPointerDown?: (event: PointerEvent) => void;
  onTopRightAnchorPointerDown?: (event: PointerEvent) => void;
  onRightAnchorPointerDown?: (event: PointerEvent) => void;
  onBottomLeftAnchorPointerDown?: (event: PointerEvent) => void;
  onBottomAnchorPointerDown?: (event: PointerEvent) => void;
  onBottomRightAnchorPointerDown?: (event: PointerEvent) => void;
  onTopAnchorPointerDown?: (event: PointerEvent) => void;
  onCenterAnchorPointerDown?: (event: PointerEvent) => void;
}

export const BoundingBox2d: FunctionalComponent<BoundingBox2dProps> = ({
  bounds,
  onTopLeftAnchorPointerDown,
  onLeftAnchorPointerDown,
  onTopRightAnchorPointerDown,
  onRightAnchorPointerDown,
  onBottomLeftAnchorPointerDown,
  onBottomAnchorPointerDown,
  onBottomRightAnchorPointerDown,
  onTopAnchorPointerDown,
  onCenterAnchorPointerDown,
}) => {
  const padded = Rectangle.pad(bounds, 6);
  const center = Rectangle.center(padded);

  return (
    <g>
      <rect class="bounds-outline" {...padded} />
      <rect class="bounds-click-target" {...padded} />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'top-left')}
        onGrab={onTopLeftAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'left')}
        onGrab={onLeftAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'top-right')}
        onGrab={onTopRightAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'right')}
        onGrab={onRightAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'bottom-left')}
        onGrab={onBottomLeftAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'bottom')}
        onGrab={onBottomAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'bottom-right')}
        onGrab={onBottomRightAnchorPointerDown}
      />
      <BoundingBoxAnchor
        center={getBoundingBox2dAnchorPosition(padded, 'top')}
        onGrab={onTopAnchorPointerDown}
      />
      <circle
        class="bounds-circle"
        cx={center.x}
        cy={center.y}
        r={4}
        onPointerDown={onCenterAnchorPointerDown}
      />
    </g>
  );
};
