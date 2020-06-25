import { Config } from '../config/config';
import { TokenProvider } from '../credentials/token';
import { FrameStreamingClient } from '../frame-streaming-client';

export interface CommandContext {
  stream: FrameStreamingClient;
  config: Config;
  tokenProvider: TokenProvider;
}

export type CommandFactory<T> = (...args: any[]) => Command<T>;

export type Command<T> = (context: CommandContext) => T | Promise<T>;
