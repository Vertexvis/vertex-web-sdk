// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import classNames from 'classnames';

interface Props {
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onMouseDown: (event: MouseEvent) => void;
}

const ViewerViewCubeEdge: FunctionalComponent<Props> = (
  { hovered, onHoverChange, onMouseDown },
  children
) => {
  return (
    <div
      class={classNames('cube cube-corner', { hovered })}
      onMouseDown={onMouseDown}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {children}
    </div>
  );
};

export const ViewerViewCubeTopFrontLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-front">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-top vert-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-left horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeTopFrontRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-front horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-top vert-end horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-right">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomFrontLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-front vert-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-bottom">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-left vert-end horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomFrontRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-front vert-end horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-bottom horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-right vert-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeTopBackLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-back horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-top">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-left">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeTopBackRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-back">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-top horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-right horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomBackLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-back horiz-end vert-end">
        <div class="cube-edge-face cube-corner-face position-bottom position-right"></div>
      </div>
      <div class="cube-face cube-face-bottom vert-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-left vert-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomBackRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-back vert-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-bottom vert-end horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
      <div class="cube-face cube-face-right vert-end horiz-end">
        <div class="cube-edge-face cube-corner-face"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeTopFrontEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-top horiz-center vert-end">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
      <div class="cube-face cube-face-front horiz-center">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomFrontEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-bottom horiz-center">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
      <div class="cube-face cube-face-front horiz-center vert-end">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeFrontLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-left horiz-end vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
      <div class="cube-face cube-face-front vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeFrontRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-right vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
      <div class="cube-face cube-face-front horiz-end vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeTopBackEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-top horiz-center">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
      <div class="cube-face cube-face-back horiz-center">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomBackEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-bottom horiz-center vert-end">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
      <div class="cube-face cube-face-back horiz-center vert-end">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBackLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-left vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
      <div class="cube-face cube-face-back horiz-end vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBackRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-right vert-center horiz-end">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
      <div class="cube-face cube-face-back vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeTopLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-top vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
      <div class="cube-face cube-face-left horiz-center">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomLeftEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-left horiz-center vert-end">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
      <div class="cube-face cube-face-bottom vert-center">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeTopRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-top vert-center horiz-end">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
      <div class="cube-face cube-face-right horiz-center">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};

export const ViewerViewCubeBottomRightEdge: FunctionalComponent<Props> = (
  props
) => {
  return (
    <ViewerViewCubeEdge {...props}>
      <div class="cube-face cube-face-right horiz-center vert-end">
        <div class="cube-edge-face cube-edge-face-horiz"></div>
      </div>
      <div class="cube-face cube-face-bottom vert-center horiz-end">
        <div class="cube-edge-face cube-edge-face-vert"></div>
      </div>
    </ViewerViewCubeEdge>
  );
};
