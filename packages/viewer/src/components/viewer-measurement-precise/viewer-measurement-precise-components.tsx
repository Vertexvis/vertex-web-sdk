// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';

import {
  DistanceVectorOverlay,
  LineOverlay,
  MeasurementOverlay,
  PointOverlay,
} from '../../lib/measurement/overlays';
import { FramePerspectiveCamera, Viewport } from '../../lib/types';

interface MeasurementOverlayViewProps<O extends MeasurementOverlay> {
  overlay: O;
  viewport: Viewport;
  camera: FramePerspectiveCamera;
}

export const MeasurementOverlayView: FunctionalComponent<
  MeasurementOverlayViewProps<MeasurementOverlay>
> = ({ overlay, viewport, camera }) => {
  if (overlay.type === 'point') {
    return (
      <PointOverlayView overlay={overlay} viewport={viewport} camera={camera} />
    );
  } else if (overlay.type === 'line') {
    return (
      <LineOverlayView overlay={overlay} viewport={viewport} camera={camera} />
    );
  } else {
    return (
      <DistanceVectorOverlayView
        overlay={overlay}
        viewport={viewport}
        camera={camera}
      />
    );
  }
};

const PointOverlayView: FunctionalComponent<
  MeasurementOverlayViewProps<PointOverlay>
> = ({ overlay: { point }, camera, viewport }) => {
  const { x, y } = viewport.transformWorldToViewport(
    point,
    camera.projectionViewMatrix
  );

  return (
    <div class="point-overlay" style={{ left: `${x}px`, top: `${y}px` }} />
  );
};

const LineOverlayView: FunctionalComponent<
  MeasurementOverlayViewProps<LineOverlay>
> = ({ overlay: { start, end }, camera, viewport }) => {
  const m = camera.projectionViewMatrix;

  const sw = viewport.transformWorldToViewport(start, m);
  const ew = viewport.transformWorldToViewport(end, m);

  return (
    <vertex-viewer-measurement-line
      class="measurement-line"
      start={sw}
      end={ew}
    />
  );
};

const DistanceVectorOverlayView: FunctionalComponent<
  MeasurementOverlayViewProps<DistanceVectorOverlay>
> = ({ overlay: { x, y, z }, camera, viewport }) => {
  const m = camera.projectionViewMatrix;

  const xs = viewport.transformWorldToViewport(x.start, m);
  const xe = viewport.transformWorldToViewport(x.end, m);
  const ys = viewport.transformWorldToViewport(y.start, m);
  const ye = viewport.transformWorldToViewport(y.end, m);
  const zs = viewport.transformWorldToViewport(z.start, m);
  const ze = viewport.transformWorldToViewport(z.end, m);

  return (
    <Fragment>
      <vertex-viewer-measurement-line
        class="measurement-line distance-vector-x"
        start={xs}
        end={xe}
      />
      <vertex-viewer-measurement-line
        class="measurement-line distance-vector-y"
        start={ys}
        end={ye}
      />
      <vertex-viewer-measurement-line
        class="measurement-line distance-vector-z"
        start={zs}
        end={ze}
      />
    </Fragment>
  );
};
