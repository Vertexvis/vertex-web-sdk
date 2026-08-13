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
      worker.worker.postMessage(task.bytes);
    }
  }
}

let poolLoader: Promise<DecodePngPool> | undefined;

const DEFAULT_POOL_SIZE = 1;

function getPoolSize(): number {
  if (typeof window !== 'undefined') {
    const concurrency = window.navigator.hardwareConcurrency ?? 8;
    return Math.ceil(concurrency / 4);
  } else {
    return DEFAULT_POOL_SIZE;
  }
}

async function getPool(): Promise<DecodePngPool> {
  if (poolLoader == null) {
    poolLoader = Promise.resolve().then(() => {
      const size = getPoolSize();
      console.debug(`Spawning PNG worker pool [size=${size}]`);
      return new DecodePngPool(size);
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
  void getPool();
}
