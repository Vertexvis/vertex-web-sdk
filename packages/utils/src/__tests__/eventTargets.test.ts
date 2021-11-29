import { once } from '../eventTargets';

describe(once, () => {
  it('resolves with dispatched event', async () => {
    const target = new EventTarget();
    const waitForEvent = once(target, 'click');
    target.dispatchEvent(new MouseEvent('click'));

    await expect(waitForEvent).resolves.toMatchObject({ type: 'click' });
  });
});
