import { Disposable } from '@vertexvis/utils';
import { Token } from '../token';
import { Frame, Orientation, SynchronizedClock } from '../types';
import { Resource } from '../types/loadableResource';

export interface Disconnected {
  readonly type: 'disconnected';
}

export interface Connecting {
  readonly type: 'connecting';
  readonly resource: Resource;
  readonly connection: Disposable;
}

export interface Connected {
  readonly type: 'connected';
  readonly resource: Resource;
  readonly connection: Disposable;
  readonly sceneViewId: string;
  readonly streamId: string;
  readonly worldOrientation: Orientation;
  readonly token: Token;
  readonly frame: Frame;
  readonly clock: SynchronizedClock;
}

export interface Reconnecting {
  readonly type: 'reconnecting';
  readonly resource: Resource;
  readonly connection: Disposable;
}

export type FrameStreamState =
  | Disconnected
  | Connecting
  | Connected
  | Reconnecting;
