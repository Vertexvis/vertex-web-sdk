import { Config } from '../config/config';
import { CredentialsProvider } from '../credentials/credentials';
import { HttpClient } from '@vertexvis/network';
import { FrameStreamingClient } from '../frame-streaming-client';

export interface CommandContext {
  stream: FrameStreamingClient;
  httpClient: HttpClient.HttpClient;
  config: Config;
  credentialsProvider: CredentialsProvider;
}

export type CommandFactory<T> = (...args: any[]) => Command<T>;

export type Command<T> = (context: CommandContext) => T | Promise<T>;
