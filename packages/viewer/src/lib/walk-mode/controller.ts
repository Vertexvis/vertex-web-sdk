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
  ];

  private excludePredicates: Array<(el: Element) => boolean> = [];

  public constructor(private model: WalkModeModel) {
    this.updateModelExclusions();
  }

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
   * `teleportHeightScalar` - scalar used for fine-tuning the distance to offset
   * the camera from a surface when performing a `teleport-and-align`. A larger
   * number here will result in a shorter distance from the surface and vice-versa.
   * Defaults to `8.5`.
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

  public addKeyBinding(
    operation: ViewerWalkModeOperation,
    ...keys: string[]
  ): void {
    this.model.addKeyBinding(operation, new KeyBinding(...keys));
  }

  public replaceKeyBinding(
    operation: ViewerWalkModeOperation,
    ...keys: string[]
  ): void {
    this.model.replaceKeyBinding(operation, new KeyBinding(...keys));
  }

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
