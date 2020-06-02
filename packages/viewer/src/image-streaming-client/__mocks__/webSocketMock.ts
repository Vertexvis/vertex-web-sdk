export const addEventListenerMock = jest.fn();

export const removeEventListenerMock = jest.fn();

export class WebSocketMock {
  private eventListeners: Record<string, VoidFunction> = {};

  public addEventListener(name, callback): void {
    addEventListenerMock();
    this.eventListeners[name] = callback;

    if (name === 'open') {
      callback();
    }
  }

  public removeEventListener(name, callback): void {
    removeEventListenerMock();
    this.eventListeners[name] = null;
  }

  public close(): void {
    this.eventListeners.close!();
  }
}
