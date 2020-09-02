import { Disposable } from '@vertexvis/utils';
import { CommandFactory } from './command';
import { ConfigProvider } from '../config/config';
import { StreamApi } from '@vertexvis/stream-api';
/* eslint-disable @typescript-eslint/no-explicit-any */
interface CommandDefinition<R> {
  factory: CommandFactory<R>;
  thisArg: any | undefined;
}

export class CommandRegistry {
  private commands: Record<string, CommandDefinition<any>> = {};

  public constructor(
    private stream: StreamApi,
    private configProvider: ConfigProvider
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
          stream: this.stream,
          config: this.configProvider(),
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
/* eslint-enable @typescript-eslint/no-explicit-any */
