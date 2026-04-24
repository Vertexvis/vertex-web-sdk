declare module 'worker:*.worker.js' {
  interface QueuedTask<Return> {
    then: Promise<Return>['then'];
    cancel(): void;
  }

  export interface Pool<ThreadType> {
    completed(allowResolvingImmediately?: boolean): Promise<any>;
    settled(allowResolvingImmediately?: boolean): Promise<Error[]>;
    queue<Return>(task: (thread: ThreadType) => Return): QueuedTask<Return>;
  }

  interface SpawnPoolOptions {
    concurrency?: number;
    maxQueuedJobs?: number;
    name?: string;
    size?: number;
    terminate?: unknown;
  }

  export interface WorkerModule<T> {
    makeWorker(): Worker;
    makeController(): unknown;
    spawnPool(options?: SpawnPoolOptions): Pool<T>;
    spawnWorker(terminate?: unknown): Promise<T>;
  }

  export function loadWorker<T = any>(): Promise<WorkerModule<T>>;
}
