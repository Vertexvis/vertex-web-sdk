import type { DecodePngFn } from './png-decoder';
import { loadWorker, WorkerModule, Pool } from 'worker:./png-decoder';

type DecodePngModule = WorkerModule<DecodePngFn>;
type DecodePngPool = Pool<DecodePngFn>;

let workerLoader: Promise<DecodePngModule> | undefined;
let poolLoader: Promise<DecodePngPool> | undefined;

const DEFAULT_POOL_SIZE = 1;

function loadWorkerModule(): Promise<DecodePngModule> {
  if (workerLoader == null) {
    console.debug(`Loading PNG worker module`);
    workerLoader = loadWorker();
  }
  return workerLoader;
}

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
    poolLoader = loadWorkerModule().then(async ({ spawnPool }) => {
      const size = getPoolSize();
      console.debug(`Spawning PNG worker pool [size=${size}]`);
      return spawnPool({ size });
    });
  }
  return poolLoader;
}
export const decodePng: DecodePngFn = async (bytes) => {
  const pool = await getPool();
  return pool.queue((decode) => decode(bytes));
};

// Prefetch the worker and initialize the pool.
getPool();
