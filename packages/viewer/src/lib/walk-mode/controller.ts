import { Disposable } from '@vertexvis/utils';

import { KeyBinding } from '../keyBinding';
import {
  ViewerTeleportMode,
  ViewerWalkModeConfiguration,
  ViewerWalkModeOperation,
  WalkModeModel,
} from './model';

export class WalkModeController {
  private excludeTagNames: Array<string> = [
    'VERTEX-SCENE-TREE',
    'VERTEX-SCENE-TREE-SEARCH',
    'VERTEX-VIEWER-PIN-TOOL',
    'INPUT',
    'TEXTAREA',
  ];

  private excludePredicates: Array<(el: Element) => boolean> = [];

  public constructor(private model: WalkModeModel) {
    this.updateModelExclusions();
  }

  /**
   * Sets whether downstream walk mode interaction handlers are enabled.
   * Setting this value to `false` will remove all event listeners for
   * the interactions, and setting this value to `true` will add or
   * re-add the event listeners.
   */
  public setEnabled(enabled: boolean): void {
    this.model.setEnabled(enabled);
  }

  /**
   * Sets the `ViewerTeleportMode` to be used with a `<vertex-viewer-teleport-tool>`.
   */
  public setTeleportMode(mode?: ViewerTeleportMode): void {
    this.model.setTeleportMode(mode);
  }

  /**
   * Updates the configuration for downstream walk mode interaction handlers.
   *
   * `teleportHeightPercentage` - percentage used for fine-tuning the distance to offset
   * the camera from a surface when performing a `teleport-and-align`. This percentage is
   * used alongside the shortest side of the visible bounding box to determine how far to
   * place the camera from the surface that has been hit, with a larger percentage placing
   * the camera further from the surface and vice-versa. Defaults to 11.75%.
   *
   * `keyboardWalkSpeed` - speed to move the camera when performing keyboard-based
   * walk interactions. A larger number here will result in a faster walk speed through
   * the model and vice-versa. Defaults to `5`.
   *
   * `keyboardPivotDegrees` - number of degrees to move the camera when performing
   * keyboard-based pivot interactions. Defaults to `1`.
   *
   * `keyboardRepeatIntervalMs` - number of milliseconds to repeat keyboard-based interactions.
   * this value is multiplicative with the `keyboardWalkSpeed` and `keyboardPivotDegrees`, and
   * lower numbers will result in faster movement and vice-versa. Defaults to `25`.
   *
   */
  public updateConfiguration(
    configuration: Partial<ViewerWalkModeConfiguration>
  ): void {
    const existing = this.model.getConfiguration();

    this.model.setConfiguration({
      ...existing,
      ...configuration,
    });
  }

  /**
   * Adds a custom keybinding for a specific walk operation. This will append to the
   * existing set of keybindings to allow for multiple keybindings for a specific
   * operation. To replace the defaults, see `replaceKeyBinding`.
   */
  public addKeyBinding(
    operation: ViewerWalkModeOperation,
    ...keys: string[]
  ): void {
    this.model.addKeyBinding(operation, new KeyBinding(...keys));
  }

  /**
   * Adds a custom keybinding for a specific walk operation. This will replace any
   * existing keybindings to allow for overriding the default behavior.
   *
   * @example
   * ```
   * const walkModeTool = document.querySelector('vertex-viewer-walk-mode-tool');
   *
   * // Remove keybinding for the `PIVOT_UP` operation
   * walkModeTool.controller.replaceKeyBinding('PIVOT_UP');
   *
   * // Replace keybinding for `WALK_FORWARD` with `ArrowUp` instead of `w`
   * walkModeTool.controller.replaceKeyBinding('WALK_FORWARD', 'ArrowUp');
   * ```
   */
  public replaceKeyBinding(
    operation: ViewerWalkModeOperation,
    ...keys: string[]
  ): void {
    this.model.replaceKeyBinding(operation, new KeyBinding(...keys));
  }

  /**
   * Adds an exclusion for specific elements when responding to keyboard
   * events. This is useful when there are other elements on screen that
   * require keyboard interaction and the walk mode handlers should not
   * respond to the keyboard events. Can be either a element's `tagName`
   * or a predicate. Returns a `Disposable` that can be used to remove the
   * exclusion.
   *
   * Default `tagName` exclusions:
   * 'VERTEX-SCENE-TREE'
   * 'VERTEX-SCENE-TREE-SEARCH'
   * 'VERTEX-VIEWER-PIN-TOOL'
   * 'INPUT'
   * 'TEXTAREA'
   */
  public excludeElement(predicate: (el: Element) => boolean): Disposable;
  public excludeElement(tagName: string): Disposable;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public excludeElement(...args: any[]): Disposable {
    if (typeof args[0] === 'string') {
      this.excludeTagNames = [...this.excludeTagNames, args[0]];

      this.updateModelExclusions();

      return {
        dispose: () => {
          this.excludeTagNames = this.excludeTagNames.filter(
            (tn) => tn !== args[0]
          );
        },
      };
    } else {
      this.excludePredicates = [...this.excludePredicates, args[0]];

      this.updateModelExclusions();

      return {
        dispose: () => {
          this.excludePredicates = this.excludePredicates.filter(
            (tn) => tn !== args[0]
          );
        },
      };
    }
  }

  private updateModelExclusions(): void {
    this.model.setExcludedPredicate(
      (el) =>
        this.excludeTagNames.some((tn) => tn === el.tagName) ||
        this.excludePredicates.some((p) => p(el))
    );
  }
}
