// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';

import {
  DistanceVectorOverlay,
  LineOverlay,
  MeasurementOverlay,
} from '../../lib/measurement';
import { FramePerspectiveCamera, Viewport } from '../../lib/types';
import {
  RenderParams,
  translateWorldLineToViewport,
} from '../viewer-measurement-distance/utils';

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
> = ({ overlay, camera, viewport }) => {
  const m = camera.projectionViewMatrix;

  const { start, end } = translateWorldLineToViewport(overlay, {
    camera,
    projectionViewMatrix: m,
    viewport,
  });

  return (
    <vertex-viewer-measurement-line
      class="measurement-line"
      start={start}
      end={end}
    />
  );
};

const DistanceVectorOverlayView: FunctionalComponent<
  MeasurementOverlayViewProps<DistanceVectorOverlay>
> = ({ overlay: { x, y, z }, camera, viewport }) => {
  const m = camera.projectionViewMatrix;
  const params: RenderParams = { camera, projectionViewMatrix: m, viewport };

  const { start: xs, end: xe } = translateWorldLineToViewport(x, params);
  const { start: ys, end: ye } = translateWorldLineToViewport(y, params);
  const { start: zs, end: ze } = translateWorldLineToViewport(z, params);

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
