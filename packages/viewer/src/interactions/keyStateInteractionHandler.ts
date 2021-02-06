import { EventDispatcher, Listener, Disposable } from '@vertexvis/utils';
import { InteractionHandler } from './interactionHandler';

export class KeyStateInteractionHandler implements InteractionHandler {
  private pressed: Record<string, boolean> = {};

  private keyStateChange = new EventDispatcher<Record<string, boolean>>();

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  public initialize(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  public getState(): Record<string, boolean> {
    return this.pressed;
  }

  public onKeyStateChange(
    listener: Listener<Record<string, boolean>>
  ): Disposable {
    return this.keyStateChange.on(listener);
  }

  public isKeyPressed(key: string): boolean {
    return !!this.pressed[key];
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    this.pressed = { ...this.pressed, [event.key]: true };
    this.keyStateChange.emit(this.pressed);
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    this.pressed = { ...this.pressed, [event.key]: false };
    this.keyStateChange.emit(this.pressed);
  }
}
