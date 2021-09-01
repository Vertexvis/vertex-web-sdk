// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point, Angle } from '@vertexvis/geometry';

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
      onPointerDown={(event) => {
        console.log(event);
        onGrab?.(event);
      }}
    />
  );
};

export interface BoundingBox1dProps {
  start: Point.Point;
  end: Point.Point;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}

export const BoundingBox1d: FunctionalComponent<BoundingBox1dProps> = ({
  start,
  end,
  onStartAnchorPointerDown,
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
        onGrab={(event) => {
          console.log(event);
          onStartAnchorPointerDown?.(event);
        }}
      />
      <BoundingBoxAnchor
        center={end}
        angle={angle}
        onGrab={onEndAnchorPointerDown}
      />
      <circle class="bounds-circle" cx={center.x} cy={center.y} r={4} />
    </g>
  );
};

// export interface BoundingBox2dProps {
//   start: Point.Point;
//   end: Point.Point;
//   onStartAnchorPointerDown?: (event: PointerEvent) => void;
//   onEndAnchorPointerDown?: (event: PointerEvent) => void;
// }

// export const BoundingBox2d: FunctionalComponent<BoundingBox2dProps> = ({
//   start,
//   end,
//   onStartAnchorPointerDown,
//   onEndAnchorPointerDown,
// }) => {};
