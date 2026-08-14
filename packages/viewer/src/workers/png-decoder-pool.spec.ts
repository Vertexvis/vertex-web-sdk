jest.mock('native-worker:./png-decoder.worker.js', () => ({
  makeWorker: jest.fn(),
}));

import type { DecodedPng } from 'fast-png';
import { makeWorker } from 'native-worker:./png-decoder.worker.js';

import { decodePng } from './png-decoder-pool';

class FakeWorker {
  public readonly postMessage = jest.fn();
  public readonly terminate = jest.fn();
  private readonly listeners = new Map<string, (event: never) => void>();

  public addEventListener(
    type: string,
    listener: (event: never) => void,
  ): void {
    this.listeners.set(type, listener);
  }

  public respond(result: DecodedPng): void {
    this.listeners.get('message')?.({ data: { result } } as never);
  }
}

describe('decodePng', () => {
  const fakeWorkers: FakeWorker[] = [];

  beforeAll(() => {
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      value: FakeWorker,
    });
    Object.defineProperty(window.navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 1,
    });
    (makeWorker as jest.Mock).mockImplementation(() => {
      const worker = new FakeWorker();
      fakeWorkers.push(worker);
      return worker;
    });
  });

  it('queues PNGs and resolves them in worker response order', async () => {
    const first = decodePng(new Uint8Array([1]));
    const second = decodePng(new Uint8Array([2]));

    await new Promise((resolve) => setTimeout(resolve));
    expect(fakeWorkers).toHaveLength(1);
    expect(fakeWorkers[0].postMessage).toHaveBeenCalledWith(
      new Uint8Array([1]),
    );
    expect(fakeWorkers[0].postMessage).toHaveBeenCalledTimes(1);

    const firstResult = pngResult(1);
    fakeWorkers[0].respond(firstResult);
    await expect(first).resolves.toBe(firstResult);
    expect(fakeWorkers[0].postMessage).toHaveBeenCalledWith(
      new Uint8Array([2]),
    );

    const secondResult = pngResult(2);
    fakeWorkers[0].respond(secondResult);
    await expect(second).resolves.toBe(secondResult);
  });

  it('continues processing after postMessage throws', async () => {
    const worker = fakeWorkers[0];
    const error = new DOMException('ArrayBuffer is detached.', 'DataCloneError');
    worker.postMessage.mockImplementationOnce(() => {
      throw error;
    });

    await expect(decodePng(new Uint8Array([1]))).rejects.toBe(error);

    const next = decodePng(new Uint8Array([2]));
    await new Promise((resolve) => setTimeout(resolve));
    expect(worker.postMessage).toHaveBeenLastCalledWith(new Uint8Array([2]));

    const result = pngResult(2);
    worker.respond(result);
    await expect(next).resolves.toBe(result);
  });
});

function pngResult(value: number): DecodedPng {
  return {
    channels: 1,
    data: new Uint8Array([value]),
    depth: 8,
    height: 1,
    text: {},
    width: 1,
  };
}
