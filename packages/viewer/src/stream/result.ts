import { StreamApi } from '@vertexvis/stream-api';

export class Result<T = undefined> {
  public constructor(public data: T, private stream: StreamApi) {}
}
