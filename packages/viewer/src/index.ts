/**
 * @module Viewer
 */
import * as ColorMaterial from './lib/scenes/colorMaterial';

export { ColorMaterial };

export * from './components';

export * from './lib/interactions/interactionHandler';

export * from './lib/interactions/keyInteraction';

export { Config } from './lib/config/config';

export { Environment } from './lib/config/environment';

export { Scene } from './lib/scenes';

export { Frame, LoadableResource, SynchronizedClock } from './lib/types';

import { TapEventDetails } from './lib/interactions/tapEventDetails';

export { TapEventDetails };
