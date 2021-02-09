import { KeyStateInteractionHandler } from '../keyStateInteractionHandler';

const dispatchKeydown = (key: string): void => {
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
    })
  );
};

const dispatchKeyup = (key: string): void => {
  window.dispatchEvent(
    new KeyboardEvent('keyup', {
      key,
    })
  );
};

describe(KeyStateInteractionHandler, () => {
  it('should add and remove event listeners properly', () => {
    const keyStateInteractionHandler = new KeyStateInteractionHandler();
    keyStateInteractionHandler.initialize();

    dispatchKeydown('Alt');

    expect(keyStateInteractionHandler.getState()).toMatchObject(
      expect.objectContaining({
        Alt: true,
      })
    );

    keyStateInteractionHandler.dispose();

    dispatchKeydown('Meta');

    expect(keyStateInteractionHandler.getState()).not.toMatchObject(
      expect.objectContaining({
        Meta: true,
      })
    );
  });

  it('should track key state', () => {
    const keyStateInteractionHandler = new KeyStateInteractionHandler();
    keyStateInteractionHandler.initialize();

    dispatchKeydown('Alt');
    dispatchKeydown('Meta');

    expect(keyStateInteractionHandler.getState()).toMatchObject(
      expect.objectContaining({
        Alt: true,
        Meta: true,
      })
    );

    dispatchKeyup('Alt');

    expect(keyStateInteractionHandler.getState()).toMatchObject(
      expect.objectContaining({
        Alt: false,
        Meta: true,
      })
    );
  });
});
