import { Disposable } from '@vertexvis/utils';
import { CommandFactory } from './command';
import { ConfigProvider } from '../config';
import { StreamApi } from '@vertexvis/stream-api';

interface CommandDefinition<R> {
  factory: CommandFactory<R>;
  thisArg: unknown | undefined;
}

export class CommandRegistry {
  private commands: Record<string, CommandDefinition<unknown>> = {};

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

  public execute<R>(id: string, ...args: unknown[]): Promise<R> {
    const commandDefinition = this.getCommandDefinition(id);
    if (commandDefinition != null) {
      const command = commandDefinition.factory.apply(
        commandDefinition.thisArg,
        args
      );

      return new Promise<R>((resolve, _) => {
        resolve(
          command({
            stream: this.stream,
            config: this.configProvider(),
          }) as R
        );
      });
    } else {
      throw new Error(`Command not registered for \`${id}\``);
    }
  }

  private getCommandDefinition(
    id: string
  ): CommandDefinition<unknown> | undefined {
    return this.commands[id];
  }
}
