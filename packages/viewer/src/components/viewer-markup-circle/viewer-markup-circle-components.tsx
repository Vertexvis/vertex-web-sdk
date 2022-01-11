// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Rectangle } from '@vertexvis/geometry';
import classNames from 'classnames';

import { getBoundingBox2dAnchorPosition } from '../viewer-markup/utils';
import { RelativeAnchor } from '../viewer-markup/viewer-markup-components';

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
    <div class="bounds-container">
      <div
        class="bounds-outline"
        style={{
          top: `${padded.y}px`,
          left: `${padded.x}px`,
          width: `${padded.width}px`,
          height: `${padded.height}px`,
        }}
      ></div>
      <RelativeAnchor
        id="bounding-box-2d-top-left-anchor"
        name="top-left-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'top-left')}
        onPointerDown={onTopLeftAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-left-anchor"
        name="left-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'left')}
        onPointerDown={onLeftAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-top-right-anchor"
        name="top-right-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'top-right')}
        onPointerDown={onTopRightAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-right-anchor"
        name="right-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'right')}
        onPointerDown={onRightAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-bottom-left-anchor"
        name="bottom-left-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'bottom-left')}
        onPointerDown={onBottomLeftAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-bottom-anchor"
        name="bottom-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'bottom')}
        onPointerDown={onBottomAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-bottom-right-anchor"
        name="bottom-right-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'bottom-right')}
        onPointerDown={onBottomRightAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-top-anchor"
        name="top-anchor"
        point={getBoundingBox2dAnchorPosition(padded, 'top')}
        onPointerDown={onTopAnchorPointerDown}
      >
        <div
          class={classNames('bounds-default-anchor', 'bounds-edge-anchor')}
        />
      </RelativeAnchor>
      <RelativeAnchor
        id="bounding-box-2d-center-anchor"
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
