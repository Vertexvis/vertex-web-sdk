import 'threadsx/register';

import { ExposedAs, Pool, spawn } from 'threadsx';

import type { DecodePngFn } from './png-decoder.worker';
import { pngDecoderWorkerUrl } from './worker-url';

type DecodePngPool = Pool<ExposedAs<DecodePngFn>>;

let poolLoader: DecodePngPool | undefined;

const DEFAULT_POOL_SIZE = 1;

function getPoolSize(): number {
  if (typeof window !== 'undefined') {
    const concurrency = window.navigator.hardwareConcurrency ?? 8;
    return Math.ceil(concurrency / 4);
  } else {
    return DEFAULT_POOL_SIZE;
  }
}

function getPool(): DecodePngPool {
  if (poolLoader == null) {
    const size = getPoolSize();
    console.debug(`Spawning PNG worker pool [size=${size}]`);
    poolLoader = Pool(
      () => spawn<DecodePngFn>(new Worker(pngDecoderWorkerUrl)),
      { size },
    );
  }
  return poolLoader;
}

export const decodePng: DecodePngFn = async (bytes) => {
  const pool = getPool();
  return pool.queue((decode: DecodePngFn) => decode(bytes));
};
