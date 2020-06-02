import { Config } from '../config/config';
import { CredentialsProvider } from '../credentials/credentials';
import { HttpClient } from '@vertexvis/network';
import { StreamingClient } from '../streaming-client';

export interface CommandContext<T extends StreamingClient> {
  stream: T;
  httpClient: HttpClient.HttpClient;
  config: Config;
  credentialsProvider: CredentialsProvider;
}

export type CommandFactory<T, S extends StreamingClient> = (
  ...args: any[]
) => Command<T, S>;

export type Command<T, S extends StreamingClient> = (
  context: CommandContext<S>
) => T | Promise<T>;
