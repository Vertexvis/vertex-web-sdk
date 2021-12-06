import { once } from '../eventTargets';

describe(once, () => {
  it('resolves with dispatched event', async () => {
    const target = new EventTarget();
    const waitForEvent = once(target, 'my-event');
    target.dispatchEvent(new Event('my-event'));

    await expect(waitForEvent).resolves.toMatchObject({ type: 'my-event' });
  });
});
