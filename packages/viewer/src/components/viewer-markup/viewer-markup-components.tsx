// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point } from '@vertexvis/geometry';

export interface RelativeAnchorProps {
  id?: string;
  transform?: string;
  rotation?: number;
  name: string;
  point: Point.Point;
  onPointerDown?: (event: PointerEvent) => void;
}

export const RelativeAnchor: FunctionalComponent<RelativeAnchorProps> = (
  { id, transform, rotation, name, point, onPointerDown },
  children
) => {
  return (
    <div
      id={id}
      class="bounds-anchor-position"
      style={{
        top: `${point.y}px`,
        left: `${point.x}px`,
      }}
      onTouchStart={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
    >
      <div style={{ transform }}>
        <div
          class="bounds-anchor"
          style={{
            transform: `rotateZ(${rotation ?? 0}deg)`,
          }}
        >
          <slot name={name}>{children}</slot>
        </div>
      </div>
    </div>
  );
};

export interface SvgShadowProps {
  id: string;
  scale?: number;
}

export const SvgShadow: FunctionalComponent<SvgShadowProps> = ({
  id,
  scale,
}) => {
  // Scale default values for a `<filter>` element by the provided scale.
  // This prevents the filter area from being too small when scale is greater than 1,
  // and uses the default values for a scale less than 1 to prevent the same issue.
  // See https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/filter
  // for more details on the default values used here.
  const effectiveScale = scale ?? 1;
  const xOffset = Math.max(10, 10 * effectiveScale);
  const yOffset = Math.max(10, 10 * effectiveScale);
  const width = Math.max(120, 110 * effectiveScale + xOffset);
  const height = Math.max(120, 110 * effectiveScale + yOffset);

  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      x={`${-xOffset}%`}
      y={`${-yOffset}%`}
      width={`${width}%`}
      height={`${height}%`}
    >
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
