import { Config } from '../config/config';
import { StreamApi } from '@vertexvis/stream-api';

export interface CommandContext {
  stream: StreamApi;
  config: Config;
}

export type CommandFactory<T> = (...args: unknown[]) => Command<T>;

export type Command<T> = (context: CommandContext) => T | Promise<T>;
