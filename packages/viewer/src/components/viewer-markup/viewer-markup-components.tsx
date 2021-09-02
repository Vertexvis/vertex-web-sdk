// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point, Angle, Rectangle } from '@vertexvis/geometry';
import { DeviceSize } from '../../lib/device';
import { getBoundingBox2dAnchorPosition } from './utils';

export interface SvgShadowProps {
  id: string;
}

export const SvgShadow: FunctionalComponent<SvgShadowProps> = ({ id }) => {
  return (
    <filter id={id} filterUnits="userSpaceOnUse">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="0" dy="1" result="offsetblur" />
      <feFlood flood-color="#000000" flood-opacity="0.25" />
      <feComposite in2="offsetblur" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
};

export interface BoundingBoxAnchorProps {
  id?: string;
  center: Point.Point;
  angle?: number;
  width?: number;
  height?: number;
  onGrab?: (event: PointerEvent) => void;
}

export const BoundingBoxAnchor: FunctionalComponent<BoundingBoxAnchorProps> = ({
  id,
  angle,
  center,
  width,
  height,
  onGrab,
}) => {
  return (
    <rect
      id={id}
      class="bounds-rect"
      height={height ?? 8}
      width={width ?? 8}
      x={center.x - (width != null ? width / 2 : 4)}
      y={center.y - (height != null ? height / 2 : 4)}
      transform={angle ? `rotate(${angle},${center.x},${center.y})` : undefined}
      onPointerDown={onGrab}
    />
  );
};

export interface BoundingBox1dProps {
  start: Point.Point;
  end: Point.Point;
  deviceSize?: DeviceSize;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onCenterAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}

export const BoundingBox1d: FunctionalComponent<BoundingBox1dProps> = ({
  start,
  end,
  deviceSize,
  onStartAnchorPointerDown,
  onCenterAnchorPointerDown,
  onEndAnchorPointerDown,
}) => {
  const angle = Angle.normalize(
    Angle.toDegrees(Angle.fromPoints(start, end)) - 270
  );
  const center = Point.create((start.x + end.x) / 2, (start.y + end.y) / 2);
  const anchorWidth = deviceSize === 'small' ? 14 : 8;
  const anchorHeight = deviceSize === 'small' ? 14 : 8;

  return (
    <g>
      <defs>
        <SvgShadow id="bounding-box-1d-shadow" />
      </defs>
      <g filter="url(#bounding-box-1d-shadow)">
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
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onStartAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={end}
          angle={angle}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onEndAnchorPointerDown}
        />
        <circle
          id="bounding-box-1d-center"
          class="bounds-circle"
          cx={center.x}
          cy={center.y}
          r={deviceSize === 'small' ? 6 : 4}
          onPointerDown={onCenterAnchorPointerDown}
        />
      </g>
    </g>
  );
};

export interface BoundingBox2dProps {
  bounds: Rectangle.Rectangle;
  deviceSize?: DeviceSize;
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
  deviceSize,
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
  const anchorWidth = deviceSize === 'small' ? 14 : 8;
  const anchorHeight = deviceSize === 'small' ? 14 : 8;

  return (
    <g>
      <defs>
        <SvgShadow id="bounding-box-2d-shadow" />
      </defs>
      <g filter="url(#bounding-box-2d-shadow)">
        <rect class="bounds-outline" {...padded} />
        <rect class="bounds-click-target" {...padded} fill="none" />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'top-left')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onTopLeftAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'left')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onLeftAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'top-right')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onTopRightAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'right')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onRightAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'bottom-left')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onBottomLeftAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'bottom')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onBottomAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'bottom-right')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onBottomRightAnchorPointerDown}
        />
        <BoundingBoxAnchor
          center={getBoundingBox2dAnchorPosition(padded, 'top')}
          width={anchorWidth}
          height={anchorHeight}
          onGrab={onTopAnchorPointerDown}
        />
        <circle
          class="bounds-circle"
          cx={center.x}
          cy={center.y}
          r={deviceSize === 'small' ? 6 : 4}
          onPointerDown={onCenterAnchorPointerDown}
        />
      </g>
    </g>
  );
};
