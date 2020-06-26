import { Config } from '../config/config';
import { TokenProvider } from '../credentials/token';
import { StreamApi } from '@vertexvis/stream-api';

export interface CommandContext {
  stream: StreamApi;
  config: Config;
  tokenProvider: TokenProvider;
}

export type CommandFactory<T> = (...args: any[]) => Command<T>;

export type Command<T> = (context: CommandContext) => T | Promise<T>;
