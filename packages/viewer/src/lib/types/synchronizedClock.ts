type Milliseconds = number;

/**
 * A `SynchronizedClock` allows for approximating the time on a remote machine.
 *
 * During initialization, a known time of the remote host must be supplied. Once
 * the remote time is known, this class can approximate the time on the remote
 * machine from a date or duration.
 *
 * @example
 * ```
 * const knownRemoteTime = await getRemoteTime();
 * const clock = new SynchronizedClock(knownRemoteTime);
 *
 * const localDate = new Date();
 * const serverTime = clock.remoteTime(localDate);
 *
 * const remoteDate = await getRemoteTime();
 * const localTime = clock.localTime(remoteDate);
 *
 * const currentRemoteTime = clock.remoteNow();
 * ```
 */
export class SynchronizedClock {
  public constructor(
    public readonly knownRemoteTime: Date,
    public readonly knownLocalTime = new Date()
  ) {}

  /**
   * Computes an offset duration from when this clock was instantiated.
   */
  public localOffset(): Milliseconds {
    return this.duration(this.knownLocalTime, this.localNow());
  }

  /**
   * Approximates the local time from a timestamp originating from the remote
   * machine.
   *
   * @param remoteTime A remote timestamp.
   */
  public localTime(remoteTime: Date): Date;

  /**
   * Approximates the local from an offset duration originating from the remote
   * machine's last known time.
   *
   * @param remoteDurationInMs A remote duration, in milliseconds.
   */
  public localTime(remoteDurationInMs: Milliseconds): Date;

  /**
   * Approximates the local time from a remote timestamp or duration.
   *
   * @param remoteTimeOrDurationInMs A remote timestamp or duration.
   */
  public localTime(remoteTimeOrDurationInMs: Milliseconds | Date): Date {
    const remoteTime =
      typeof remoteTimeOrDurationInMs === 'number'
        ? new Date(this.knownLocalTime.getTime() + remoteTimeOrDurationInMs)
        : remoteTimeOrDurationInMs;
    const duration = this.duration(this.knownRemoteTime, remoteTime);
    return this.addDuration(this.knownLocalTime, duration);
  }

  /**
   * Approximates an offset duration on the remote machine.
   *
   * @param localTime A local timestamp. Defaults to the current local time.
   */
  public remoteOffset(localTime: Date = new Date()): Milliseconds {
    return this.duration(
      this.remoteTime(this.knownLocalTime),
      this.remoteTime(localTime)
    );
  }

  /**
   * Approximates the current time on the remote machine.
   */
  public remoteNow(): Date {
    return this.remoteTime(this.localNow());
  }

  /**
   * Approximates the remote time from a local timestamp.
   *
   * @param localTime A local timestamp.
   */
  public remoteTime(localTime: Date): Date;

  /**
   * Approximates the remote time from a local offset duration.
   *
   * @param localDurationInMs A local offset, in milliseconds.
   * @see #localOffset
   */
  public remoteTime(localDurationInMs: Milliseconds): Date;

  /**
   * Approximates the remote time from either a local timestamp or duration.
   *
   * @param localTimeOrDurationInMs A local timestamp or duration.
   */
  public remoteTime(localTimeOrDurationInMs: Milliseconds | Date): Date {
    const localTime =
      typeof localTimeOrDurationInMs === 'number'
        ? new Date(this.knownLocalTime.getTime() + localTimeOrDurationInMs)
        : localTimeOrDurationInMs;
    const duration = this.duration(this.knownLocalTime, localTime);
    return this.addDuration(this.knownRemoteTime, duration);
  }

  private addDuration(start: Date, duration: Milliseconds): Date {
    return new Date(start.getTime() + duration);
  }

  private duration(start: Date, end: Date): Milliseconds {
    return end.getTime() - start.getTime();
  }

  private localNow(): Date {
    return new Date(Date.now());
  }
}
