import { isPromise } from './types';

export interface Timing {
  startTime: number;
  duration: number;
}

/**
 * A meter for measuring timings. Measurements are stored using the browser's
 * performance APIs, which provide high-resolution timestamps, as well as
 * provides visibility in the browser's developer tooling.
 */
export class TimingMeter {
  private measures = new Set<string>();
  private nextId = 0;

  public constructor(
    public readonly name: string,
    private readonly perf: Performance = window.performance
  ) {}

  /**
   * Clears any measurements from the buffer.
   */
  public clearMeasurements(): void {
    this.perf.clearMeasures(this.name);
  }

  /**
   * Measures the execution time of a function.
   *
   * @param target A function to execute and measure.
   */
  public measure<T>(target: () => T): T;

  /**
   * Measures the time for a promise to resolve, either successfully or not.
   *
   * @param target The promise to measure.
   */
  public measure<T>(target: Promise<T>): Promise<T>;
  public measure<T>(target: (() => T) | Promise<T>): T | Promise<T> {
    if (isPromise(target)) {
      const mark = this.begin();
      return target.finally(() => this.end(mark));
    } else if (typeof target === 'function') {
      const mark = this.begin();
      const result = target();
      this.end(mark);
      return result;
    } else {
      throw new Error('Input must be a function or Promise');
    }
  }

  /**
   * Returns a list of measurements that have been recorded, and clears the
   * internal measurement buffer.
   */
  public takeMeasurements(): Timing[] {
    const timings = this.perf.getEntriesByName(this.name);
    this.clearMeasurements();
    return timings;
  }

  /**
   * Returns the last measurement to have been recorded, and clears the internal
   * measurement buffer.
   */
  public takeLastMeasurement(): Timing | undefined {
    const measurements = this.takeMeasurements();
    return measurements[measurements.length - 1];
  }

  private begin(): string {
    const mark = `${this.name}-${this.nextId++}`;
    this.measures.add(mark);
    this.perf.mark(mark);
    return mark;
  }

  private end(mark: string): void {
    this.perf.measure(this.name, mark);
    this.perf.clearMarks(mark);
    this.measures.delete(mark);
  }
}

export const paintTime = new TimingMeter('paint_time');
