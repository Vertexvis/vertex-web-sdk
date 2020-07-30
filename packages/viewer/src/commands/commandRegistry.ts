import { Disposable } from '@vertexvis/utils';
import { CommandFactory } from './command';
import { ConfigProvider } from '../config/config';
import { TokenProvider } from '../credentials/token';
import { StreamApi } from '@vertexvis/stream-api';

interface CommandDefinition<R> {
  factory: CommandFactory<R>;
  thisArg: any | undefined;
}

export type StreamProvider = () => StreamApi;

export class CommandRegistry {
  private commands: Record<string, CommandDefinition<any>> = {};

  public constructor(
    private streamProvider: StreamProvider,
    private configProvider: ConfigProvider,
    private tokenProvider: TokenProvider
  ) {}

  public register<R, T>(
    id: string,
    factory: CommandFactory<R>,
    thisArg?: T
  ): Disposable {
    this.commands[id] = { factory, thisArg };
    return { dispose: () => delete this.commands[id] };
  }

  public execute<R>(id: string, ...args: any[]): Promise<R> {
    const commandDefinition = this.getCommandDefinition(id);
    if (commandDefinition != null) {
      const command = commandDefinition.factory.apply(
        commandDefinition.thisArg,
        args
      );

      return Promise.resolve(
        command({
          stream: this.streamProvider(),
          config: this.configProvider(),
          tokenProvider: this.tokenProvider,
        }) as any
      );
    } else {
      throw new Error(`Command not registered for \`${id}\``);
    }
  }

  private getCommandDefinition(
    id: string
  ): CommandDefinition<StreamApi> | undefined {
    return this.commands[id];
  }
}
