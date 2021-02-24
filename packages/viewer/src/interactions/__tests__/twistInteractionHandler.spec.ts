import { TwistInteractionHandler } from '../twistInteractionHandler';
import { PointerInteractionHandler } from '../pointerInteractionHandler';

describe(TwistInteractionHandler, () => {
  const baseInteractionHandler = new PointerInteractionHandler();

  const twistInteractionHandler = new TwistInteractionHandler(
    baseInteractionHandler
  );

  it('Returns true for its predicate with Command or Control pressed', () => {
    expect(twistInteractionHandler.predicate({ Alt: true })).toBe(false);
    expect(twistInteractionHandler.predicate({ Shift: true })).toBe(false);
    expect(twistInteractionHandler.predicate({ Alt: true, Shift: true })).toBe(
      true
    );
  });

  it('should set the base interaction to be twist', async () => {
    await twistInteractionHandler.fn();

    expect(baseInteractionHandler.getPrimaryInteractionType()).toEqual('twist');
  });

  it('should reset the base interaction to be rotate', async () => {
    await twistInteractionHandler.reset();

    expect(baseInteractionHandler.getPrimaryInteractionType()).toEqual(
      'rotate'
    );
  });
});
