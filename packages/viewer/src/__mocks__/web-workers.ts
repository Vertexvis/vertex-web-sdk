/* eslint-disable @typescript-eslint/no-explicit-any */

export function loadWorker(): Promise<any> {
  return Promise.resolve({ spawnPool, spawnWorker, makeController });
}

function spawnPool(): Promise<any> {
  return Promise.resolve({});
}

function spawnWorker(): Promise<any> {
  return Promise.resolve({});
}

function makeController(): any {
  return {};
}
