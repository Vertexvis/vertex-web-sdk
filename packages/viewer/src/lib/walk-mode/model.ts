import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { KeyBinding } from '../keyBinding';

export interface ViewerWalkModeConfiguration {
  teleportHeightPercentage: number;
  teleportDistancePercentage: number;
  teleportCollisionOffset: number;
  keyboardWalkSpeed: number;
  keyboardPivotDegrees: number;
  keyboardRepeatIntervalMs: number;
}

export type ViewerTeleportMode =
  | 'teleport'
  | 'teleport-and-align'
  | 'teleport-toward';

export enum ViewerWalkModeOperation {
  'MOVE_DOWN' = 'MOVE_DOWN',
  'MOVE_UP' = 'MOVE_UP',
  'PIVOT_DOWN' = 'PIVOT_DOWN',
  'PIVOT_LEFT' = 'PIVOT_LEFT',
  'PIVOT_RIGHT' = 'PIVOT_RIGHT',
  'PIVOT_UP' = 'PIVOT_UP',
  'WALK_BACKWARD' = 'WALK_BACKWARD',
  'WALK_FORWARD' = 'WALK_FORWARD',
  'WALK_LEFT' = 'WALK_LEFT',
  'WALK_RIGHT' = 'WALK_RIGHT',
}

export type ViewerWalkModeKeyBindings = Record<
  ViewerWalkModeOperation,
  KeyBinding[]
>;

export class WalkModeModel {
  private keyBindings: ViewerWalkModeKeyBindings = {
    [ViewerWalkModeOperation.MOVE_DOWN]: [
      new KeyBinding('PageDown', '!Shift', '!Alt'),
    ],
    [ViewerWalkModeOperation.MOVE_UP]: [
      new KeyBinding('PageUp', '!Shift', '!Alt'),
    ],
    [ViewerWalkModeOperation.PIVOT_DOWN]: [
      new KeyBinding('ArrowDown', '!Shift', '!Alt'),
    ],
    [ViewerWalkModeOperation.PIVOT_LEFT]: [
      new KeyBinding('ArrowLeft', '!Shift', '!Alt'),
    ],
    [ViewerWalkModeOperation.PIVOT_RIGHT]: [
      new KeyBinding('ArrowRight', '!Shift', '!Alt'),
    ],
    [ViewerWalkModeOperation.PIVOT_UP]: [
      new KeyBinding('ArrowUp', '!Shift', '!Alt'),
    ],
    [ViewerWalkModeOperation.WALK_BACKWARD]: [new KeyBinding('s')],
    [ViewerWalkModeOperation.WALK_FORWARD]: [new KeyBinding('w')],
    [ViewerWalkModeOperation.WALK_LEFT]: [new KeyBinding('a')],
    [ViewerWalkModeOperation.WALK_RIGHT]: [new KeyBinding('d')],
  };

  private configuration: ViewerWalkModeConfiguration = {
    teleportHeightPercentage: 11.75,
    teleportDistancePercentage: 2,
    teleportCollisionOffset: 1000,
    keyboardWalkSpeed: 5,
    keyboardPivotDegrees: 1,
    keyboardRepeatIntervalMs: 25,
  };

  private excludedPredicate?: (el: Element) => boolean;

  private enabled = true;
  private teleportMode?: ViewerTeleportMode;

  private enabledChanged: EventDispatcher<boolean> = new EventDispatcher();

  private teleportModeChanged: EventDispatcher<ViewerTeleportMode | undefined> =
    new EventDispatcher<ViewerTeleportMode | undefined>();

  private configurationChanged: EventDispatcher<ViewerWalkModeConfiguration> =
    new EventDispatcher<ViewerWalkModeConfiguration>();

  private keyBindingsChanged: EventDispatcher<ViewerWalkModeKeyBindings> =
    new EventDispatcher<ViewerWalkModeKeyBindings>();

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.enabledChanged.emit(enabled);
  }

  public setTeleportMode(mode?: ViewerTeleportMode): void {
    this.teleportMode = mode;
    this.teleportModeChanged.emit(mode);
  }

  public setConfiguration(configuration: ViewerWalkModeConfiguration): void {
    this.configuration = configuration;
    this.configurationChanged.emit(configuration);
  }

  public addKeyBinding(
    operation: ViewerWalkModeOperation,
    keyBinding: KeyBinding
  ): void {
    this.keyBindings[operation] = [...this.keyBindings[operation], keyBinding];
    this.keyBindingsChanged.emit(this.keyBindings);
  }

  public replaceKeyBinding(
    operation: ViewerWalkModeOperation,
    keyBinding: KeyBinding
  ): void {
    this.keyBindings[operation] = [keyBinding];
    this.keyBindingsChanged.emit(this.keyBindings);
  }

  public setExcludedPredicate(predicate: (el: Element) => boolean): void {
    this.excludedPredicate = predicate;
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  public getTeleportMode(): ViewerTeleportMode | undefined {
    return this.teleportMode;
  }

  public getTeleportHeightPercentage(): number {
    return this.configuration.teleportHeightPercentage;
  }

  public getKeyboardWalkSpeed(): number {
    return this.configuration.keyboardWalkSpeed;
  }

  public getKeyboardPivotDegrees(): number {
    return this.configuration.keyboardPivotDegrees;
  }

  public getKeyboardRepeatInterval(): number {
    return this.configuration.keyboardRepeatIntervalMs;
  }

  public getConfiguration(): ViewerWalkModeConfiguration {
    return this.configuration;
  }

  public getKeyBindings(): ViewerWalkModeKeyBindings {
    return this.keyBindings;
  }

  public operationMatches(
    operation: ViewerWalkModeOperation,
    state: Record<string, boolean>
  ): boolean {
    return this.keyBindings[operation].some((binding) =>
      binding.matches(state)
    );
  }

  public isElementExcluded(el: Element): boolean {
    return !!this.excludedPredicate?.(el);
  }

  public onEnabledChange(listener: Listener<boolean>): Disposable {
    return this.enabledChanged.on(listener);
  }

  public onTeleportModeChange(
    listener: Listener<ViewerTeleportMode | undefined>
  ): Disposable {
    return this.teleportModeChanged.on(listener);
  }

  public onConfigurationChange(
    listener: Listener<ViewerWalkModeConfiguration>
  ): Disposable {
    return this.configurationChanged.on(listener);
  }

  public onKeyBindingsChange(
    listener: Listener<ViewerWalkModeKeyBindings>
  ): Disposable {
    return this.keyBindingsChanged.on(listener);
  }
}
