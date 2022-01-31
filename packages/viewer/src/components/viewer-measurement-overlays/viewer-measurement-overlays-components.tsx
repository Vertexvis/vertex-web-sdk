// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';

import {
  DistanceVectorOverlay,
  LineOverlay,
  MeasurementOverlay,
} from '../../lib/measurement';
import { FramePerspectiveCamera, Viewport } from '../../lib/types';

interface MeasurementOverlayViewProps<O extends MeasurementOverlay> {
  overlay: O;
  viewport: Viewport;
  camera: FramePerspectiveCamera;
}

export const MeasurementOverlayView: FunctionalComponent<
  MeasurementOverlayViewProps<MeasurementOverlay>
> = ({ overlay, viewport, camera }) => {
  if (overlay.type === 'line') {
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
