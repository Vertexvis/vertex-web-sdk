import type { DecodedPng } from 'fast-png';
import { makeWorker } from 'native-worker:./png-decoder.worker.js';

import type { DecodePngFn } from './png-decoder';

interface DecodePngResponse {
  error?: string;
  result?: DecodedPng;
}

interface QueuedTask {
  bytes: Parameters<DecodePngFn>[0];
  reject: (reason: unknown) => void;
  resolve: (result: DecodedPng) => void;
}

interface WorkerSlot {
  task?: QueuedTask;
  worker: Worker;
}

class DecodePngPool {
  private readonly idleWorkers: WorkerSlot[] = [];
  private readonly queuedTasks: QueuedTask[] = [];

  public constructor(size: number) {
    for (let index = 0; index < size; index += 1) {
      this.idleWorkers.push(this.createWorker());
    }
  }

  public decode(bytes: Parameters<DecodePngFn>[0]): Promise<DecodedPng> {
    return new Promise((resolve, reject) => {
      this.queuedTasks.push({ bytes, reject, resolve });
      this.dispatch();
    });
  }

  private createWorker(): WorkerSlot {
    const slot: WorkerSlot = { worker: makeWorker() };
    slot.worker.addEventListener(
      'message',
      (event: MessageEvent<DecodePngResponse>) => {
        const task = slot.task;
        slot.task = undefined;
        this.idleWorkers.push(slot);

        if (task == null) {
          return;
        }

        if (event.data.error != null) {
          task.reject(new Error(event.data.error));
        } else if (event.data.result != null) {
          task.resolve(event.data.result);
        } else {
          task.reject(new Error('PNG worker returned an invalid response.'));
        }

        this.dispatch();
      },
    );
    slot.worker.addEventListener('error', (event) => {
      const task = slot.task;
      slot.task = undefined;
      slot.worker.terminate();

      if (task != null) {
        task.reject(event.error ?? new Error(event.message));
      }

      this.idleWorkers.push(this.createWorker());
      this.dispatch();
    });
    return slot;
  }

  private dispatch(): void {
    while (this.idleWorkers.length > 0 && this.queuedTasks.length > 0) {
      const worker = this.idleWorkers.pop();
      const task = this.queuedTasks.shift();
      if (worker == null || task == null) {
        return;
      }

      worker.task = task;
      try {
        worker.worker.postMessage(task.bytes);
      } catch (error) {
        worker.task = undefined;
        this.idleWorkers.push(worker);
        task.reject(error);
      }
    }
  }
}

let poolLoader: Promise<DecodePngPool> | undefined;

const DEFAULT_POOL_SIZE = 1;
const MAX_POOL_SIZE = 4;

function getPoolSize(): number {
  if (typeof window !== 'undefined') {
    const concurrency = window.navigator.hardwareConcurrency;
    if (concurrency == null) {
      return DEFAULT_POOL_SIZE;
    }
    return Math.min(
      MAX_POOL_SIZE,
      Math.max(DEFAULT_POOL_SIZE, Math.ceil(concurrency / 4)),
    );
  } else {
    return DEFAULT_POOL_SIZE;
  }
}

async function getPool(): Promise<DecodePngPool> {
  if (poolLoader == null) {
    if (typeof Worker === 'undefined') {
      throw new Error('Requires Web Worker for PNG decode.');
    }

    const loader = Promise.resolve().then(() => {
      const size = getPoolSize();
      console.debug(`Spawning PNG worker pool [size=${size}]`);
      return new DecodePngPool(size);
    });
    poolLoader = loader;
    void loader.catch(() => {
      // Allow a later decode attempt to recover from a transient startup error.
      if (poolLoader === loader) {
        poolLoader = undefined;
      }
    });
  }
  return poolLoader;
}

export const decodePng: DecodePngFn = async (bytes) => {
  const pool = await getPool();
  return pool.decode(bytes);
};

// Prefetch the worker and initialize the pool in browsers only.
if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
  void getPool().catch(() => {
    // decodePng will retry initialization and surface the error to its caller.
  });
}
