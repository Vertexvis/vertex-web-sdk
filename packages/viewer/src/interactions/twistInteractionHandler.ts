import { KeyState, KeyInteractionWithReset } from './keyInteraction';
import { BaseInteractionHandler } from './baseInteractionHandler';

export class TwistInteractionHandler implements KeyInteractionWithReset {
  public constructor(private baseInteractionHandler: BaseInteractionHandler) {}

  public predicate(keyState: KeyState): boolean {
    return keyState['Alt'] === true && keyState['Shift'] === true;
  }

  public async fn(): Promise<void> {
    this.baseInteractionHandler.setPrimaryInteractionType('twist');
  }

  public async reset(): Promise<void> {
    this.baseInteractionHandler.setPrimaryInteractionType('rotate');
  }
}
