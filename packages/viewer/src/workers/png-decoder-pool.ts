import type { DecodePngFn } from './png-decoder';
import { loadWorker, WorkerModule, Pool } from 'worker:./png-decoder';

type DecodePngModule = WorkerModule<DecodePngFn>;
type DecodePngPool = Pool<DecodePngFn>;

let workerLoader: Promise<DecodePngModule> | undefined;
let poolLoader: Promise<DecodePngPool> | undefined;

function loadWorkerModule(): Promise<DecodePngModule> {
  if (workerLoader == null) {
    workerLoader = loadWorker();
  }
  return workerLoader;
}

async function getPool(): Promise<DecodePngPool> {
  if (poolLoader == null && window != null) {
    poolLoader = loadWorkerModule().then(({ spawnPool }) =>
      spawnPool({
        size: Math.ceil(window.navigator.hardwareConcurrency / 4),
      })
    );
  }
  return poolLoader;
}

export const decodePng: DecodePngFn = async (bytes) => {
  const pool = await getPool();
  return pool.queue((decode) => {
    return decode(bytes);
  });
};

// Prefetch the worker and initialize the pool.
getPool();
