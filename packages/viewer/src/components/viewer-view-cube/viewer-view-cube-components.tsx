// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';
import classNames from 'classnames';
import { Vector3, Quaternion, Euler } from '@vertexvis/geometry';

type FaceEdge = 'top' | 'bottom' | 'left' | 'right';

type Corner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

type ViewCubeSide = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

interface ViewCubeSideData {
  direction: Vector3.Vector3;
  quaternion: Quaternion.Quaternion;
}

const viewCubeSides: Record<ViewCubeSide, ViewCubeSideData> = {
  front: {
    direction: Vector3.back(),
    quaternion: Quaternion.create(),
  },
  back: {
    direction: Vector3.forward(),
    quaternion: Quaternion.fromAxisAngle(Vector3.up(), Math.PI),
  },
  left: {
    direction: Vector3.left(),
    quaternion: Quaternion.fromAxisAngle(Vector3.down(), Math.PI / 2),
  },
  right: {
    direction: Vector3.right(),
    quaternion: Quaternion.fromAxisAngle(Vector3.up(), Math.PI / 2),
  },
  top: {
    direction: Vector3.up(),
    quaternion: Quaternion.fromAxisAngle(Vector3.right(), -Math.PI / 2),
  },
  bottom: {
    direction: Vector3.down(),
    quaternion: Quaternion.fromAxisAngle(Vector3.left(), -Math.PI / 2),
  },
};

interface TriadAxisProps {
  label: string;
  length: number;
  rotationAxis: Vector3.Vector3;
}

export const TriadAxis: FunctionalComponent<TriadAxisProps> = ({
  label,
  length,
  rotationAxis,
}) => {
  const axisStyles = { width: `${length + 5}px` };
  const quaternion = Quaternion.fromAxisAngle(rotationAxis, Math.PI / 2);
  const labelPos = Vector3.scale(length + 15, Vector3.right());

  return (
    <Fragment>
      <vertex-viewer-dom-group quaternion={quaternion}>
        <vertex-viewer-dom-element
          style={axisStyles}
          billboardOff
          interactionsOff
        >
          <div class={`triad-axis triad-axis-${label.toLowerCase()}`} />
        </vertex-viewer-dom-element>
        <vertex-viewer-dom-element
          rotation={Euler.create({ x: Math.PI / 2, y: 0, z: 0 })}
          style={axisStyles}
          billboardOff
          interactionsOff
        >
          <div class={`triad-axis triad-axis-${label.toLowerCase()}`} />
        </vertex-viewer-dom-element>
        <vertex-viewer-dom-element position={labelPos} interactionsOff>
          <div class={`triad-label triad-label-${label.toLowerCase()}`}>
            {label}
          </div>
        </vertex-viewer-dom-element>
      </vertex-viewer-dom-group>
    </Fragment>
  );
};

interface ViewCubeSideProps {
  label: string;
  length: number;
  side: ViewCubeSide;
  disabled: boolean;
  onPointerDown?: (event: MouseEvent) => void;
}

export const ViewCubeSide: FunctionalComponent<ViewCubeSideProps> = ({
  label,
  length,
  side,
  disabled,
  onPointerDown,
}) => {
  const { direction, quaternion } = viewCubeSides[side];
  const position = Vector3.scale(length / 2 - 0.1, direction);

  return (
    <vertex-viewer-dom-element
      class={classNames('cube-side', { disabled })}
      position={position}
      quaternion={quaternion}
      style={{ width: `${length}px`, height: `${length}px` }}
      onPointerDown={onPointerDown}
      billboardOff
    >
      <div class={`cube-side-face cube-side-face-${label.toLowerCase()}`}>
        {label}
      </div>
    </vertex-viewer-dom-element>
  );
};

interface ViewCubeCornerProps {
  length: number;
  face1Side: ViewCubeSide;
  face1Corner: Corner;
  face2Side: ViewCubeSide;
  face2Corner: Corner;
  face3Side: ViewCubeSide;
  face3Corner: Corner;
  disabled: boolean;
  onPointerDown?: (event: MouseEvent) => void;
}

export const ViewCubeCorner: FunctionalComponent<ViewCubeCornerProps> = ({
  length,
  face1Side,
  face1Corner,
  face2Side,
  face2Corner,
  face3Side,
  face3Corner,
  disabled,
  onPointerDown,
}) => {
  const { direction: dir1, quaternion: rot1 } = viewCubeSides[face1Side];
  const { direction: dir2, quaternion: rot2 } = viewCubeSides[face2Side];
  const { direction: dir3, quaternion: rot3 } = viewCubeSides[face3Side];

  const position1 = Vector3.scale(length / 2, dir1);
  const position2 = Vector3.scale(length / 2, dir2);
  const position3 = Vector3.scale(length / 2, dir3);

  const styles = { width: `${length}px`, height: `${length}px` };

  return (
    <vertex-viewer-dom-group
      class={classNames('cube-corner', { disabled })}
      onPointerDown={onPointerDown}
    >
      <vertex-viewer-dom-element
        position={position1}
        quaternion={rot1}
        style={styles}
        billboardOff
      >
        <div class={`cube-corner-face ${face1Corner}`} />
      </vertex-viewer-dom-element>
      <vertex-viewer-dom-element
        position={position2}
        quaternion={rot2}
        style={styles}
        billboardOff
      >
        <div class={`cube-corner-face ${face2Corner}`} />
      </vertex-viewer-dom-element>
      <vertex-viewer-dom-element
        position={position3}
        quaternion={rot3}
        style={styles}
        billboardOff
      >
        <div class={`cube-corner-face ${face3Corner}`} />
      </vertex-viewer-dom-element>
    </vertex-viewer-dom-group>
  );
};

interface ViewCubeEdgeProps {
  length: number;
  face1Side: ViewCubeSide;
  face2Side: ViewCubeSide;
  face1Edge: FaceEdge;
  face2Edge: FaceEdge;
  disabled: boolean;
  onPointerDown?: (event: MouseEvent) => void;
}

export const ViewCubeEdge: FunctionalComponent<ViewCubeEdgeProps> = ({
  length,
  face1Side,
  face2Side,
  face1Edge,
  face2Edge,
  disabled,
  onPointerDown,
}) => {
  const { direction: dir1, quaternion: rot1 } = viewCubeSides[face1Side];
  const { direction: dir2, quaternion: rot2 } = viewCubeSides[face2Side];
  const position1 = Vector3.scale(length / 2, dir1);
  const position2 = Vector3.scale(length / 2, dir2);
  const styles = { width: `${length}px`, height: `${length}px` };

  return (
    <vertex-viewer-dom-group
      class={classNames('cube-edge', { disabled })}
      onPointerDown={onPointerDown}
    >
      <vertex-viewer-dom-element
        position={position1}
        quaternion={rot1}
        style={styles}
        billboardOff
      >
        <div class={`cube-edge-face ${face1Edge}`} />
      </vertex-viewer-dom-element>
      <vertex-viewer-dom-element
        position={position2}
        quaternion={rot2}
        style={styles}
        billboardOff
      >
        <div class={`cube-edge-face ${face2Edge}`} />
      </vertex-viewer-dom-element>
    </vertex-viewer-dom-group>
  );
};

interface ViewCubeShadowProps {
  length: number;
}

export const ViewCubeShadow: FunctionalComponent<ViewCubeShadowProps> = ({
  length,
}) => {
  const { direction, quaternion } = viewCubeSides.top;
  const position = Vector3.scale(-length / 2, direction);

  return (
    <vertex-viewer-dom-element
      class="cube-shadow"
      position={position}
      quaternion={quaternion}
      style={{ width: `${length}px`, height: `${length}px` }}
      billboardOff
      interactionsOff
    >
      <div class="cube-shadow-face" />
    </vertex-viewer-dom-element>
  );
};
