import { Config } from '../config/config';
import { CredentialsProvider } from '../credentials/credentials';
import { FrameStreamingClient } from '../frame-streaming-client';

export interface CommandContext {
  stream: FrameStreamingClient;
  config: Config;
  credentialsProvider: CredentialsProvider;
}

export type CommandFactory<T> = (...args: any[]) => Command<T>;

export type Command<T> = (context: CommandContext) => T | Promise<T>;
