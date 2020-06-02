import { ImageStreamingClient } from '../image-streaming-client';
import { Config } from '../config/config';
import { CredentialsProvider } from '../credentials/credentials';
import { HttpClient } from '@vertexvis/network';

export interface CommandContext {
  stream: ImageStreamingClient;
  httpClient: HttpClient.HttpClient;
  config: Config;
  credentialsProvider: CredentialsProvider;
}

export type CommandFactory<T> = (...args: any[]) => Command<T>;

export type Command<T> = (context: CommandContext) => T | Promise<T>;
