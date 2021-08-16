import type { DecodePngFn } from './png-decoder';
import { loadWorker, WorkerModule, Pool } from 'worker:./png-decoder';

type DecodePngModule = WorkerModule<DecodePngFn>;
type DecodePngPool = Pool<DecodePngFn>;

let workerLoader: Promise<DecodePngModule> | undefined;
let poolLoader: Promise<DecodePngPool> | undefined;

const DEFAULT_POOL_SIZE = 1;

function loadWorkerModule(): Promise<DecodePngModule> {
  if (workerLoader == null) {
    workerLoader = loadWorker();
  }
  return workerLoader;
}

function getPoolSize(): number {
  if (typeof window !== 'undefined') {
    return Math.ceil(window.navigator.hardwareConcurrency / 4);
  } else {
    return DEFAULT_POOL_SIZE;
  }
}

async function getPool(): Promise<DecodePngPool> {
  if (poolLoader == null) {
    poolLoader = loadWorkerModule().then(({ spawnPool }) =>
      spawnPool({ size: getPoolSize() })
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
