/**
 * @module Viewer
 */
import * as ColorMaterial from './lib/scenes/colorMaterial';

export { ColorMaterial };

export * from './components';
export * from './components/scene-tree/lib';
export * from './components/scene-tree/types';
export * from './components/viewer-box-query-tool/types';
export * from './components/viewer-toolbar/types';
export * from './components/viewer-toolbar-group/types';
export { Config } from './lib/config';
export * from './lib/cursors';
export { Environment } from './lib/environment';
export * from './lib/formatter';
export * from './lib/interactions/interactionHandler';
export * from './lib/interactions/keyInteraction';
export * from './lib/measurement';
export * from './lib/pins';
export { Scene } from './lib/scenes';
export {
  EntityType,
  FrameCameraBase,
  LoadableResource,
  Frame as ReceivedFrame,
  FrameImage as ReceivedFrameImage,
  FrameScene as ReceivedFrameScene,
  FrameOrthographicCamera as ReceivedOrthographicCamera,
  FramePerspectiveCamera as ReceivedPerspectiveCamera,
  SynchronizedClock,
  Viewport,
} from './lib/types';
export * from './lib/types/markup';
export * from './lib/types/measurementUnits';
export * from './lib/volume-intersection';

import { TapEventDetails } from './lib/interactions/tapEventDetails';

export { TapEventDetails };
