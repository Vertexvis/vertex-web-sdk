import { Config } from '../config/config';
import { StreamApi } from '@vertexvis/stream-api';

export interface CommandContext {
  stream: StreamApi;
  config: Config;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type CommandFactory<T> = (...args: any[]) => Command<T>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type Command<T> = (context: CommandContext) => T | Promise<T>;
