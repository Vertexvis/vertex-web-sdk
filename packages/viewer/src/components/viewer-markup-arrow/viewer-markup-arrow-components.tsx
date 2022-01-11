// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Angle, Point } from '@vertexvis/geometry';
import classNames from 'classnames';

import { RelativeAnchor } from '../viewer-markup/viewer-markup-components';

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
    <div class="bounds-container">
      <RelativeAnchor
        id="bounding-box-1d-start-anchor"
        name="start-anchor"
        rotation={angle}
        point={start}
        onPointerDown={onStartAnchorPointerDown}
      >
        <div class={classNames('bounds-default-anchor', 'bounds-cap-anchor')} />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-1d-end-anchor"
        name="end-anchor"
        rotation={angle}
        point={end}
        onPointerDown={onEndAnchorPointerDown}
      >
        <div class={classNames('bounds-default-anchor', 'bounds-cap-anchor')} />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-1d-center-anchor"
        name="center-anchor"
        point={center}
        onPointerDown={onCenterAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-center-anchor')}
        />
      </RelativeAnchor>
    </div>
  );
};
