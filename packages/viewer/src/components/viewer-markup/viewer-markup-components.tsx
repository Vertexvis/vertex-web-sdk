// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point } from '@vertexvis/geometry';

export interface RelativeAnchorProps {
  id?: string;
  rotation?: number;
  name: string;
  point: Point.Point;
  onPointerDown?: (event: PointerEvent) => void;
}

export const RelativeAnchor: FunctionalComponent<RelativeAnchorProps> = (
  { id, rotation, name, point, onPointerDown },
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
      onPointerDown={onPointerDown}
    >
      <div
        class="bounds-anchor"
        style={{
          transform: `rotateZ(${rotation ?? 0}deg)`,
        }}
      >
        <slot name={name}>{children}</slot>
      </div>
    </div>
  );
};

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
