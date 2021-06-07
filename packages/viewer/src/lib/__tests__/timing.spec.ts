import { TimingMeter } from '../meters';

describe(TimingMeter, () => {
  const mark = jest.spyOn(window.performance, 'mark');
  const measure = jest.spyOn(window.performance, 'measure');
  const clearMeasures = jest.spyOn(window.performance, 'clearMeasures');

  const timer = new TimingMeter('timer');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(TimingMeter.prototype.clearMeasurements, () => {
    it('clears measurement buffer', () => {
      timer.clearMeasurements();

      expect(clearMeasures).toHaveBeenCalledWith('timer');
    });
  });

  describe(TimingMeter.prototype.measure, () => {
    it('measures a function', () => {
      timer.measure(() => 1);

      expect(mark).toHaveBeenCalled();
      expect(measure).toHaveBeenCalledWith('timer', expect.anything());
    });

    it('measures a resolved promise', async () => {
      await timer.measure(Promise.resolve(1));

      expect(mark).toHaveBeenCalled();
      expect(measure).toHaveBeenCalledWith('timer', expect.anything());
    });

    it('measures a rejected promise', async () => {
      try {
        await timer.measure(Promise.reject('oops'));
      } catch {}

      expect(mark).toHaveBeenCalled();
      expect(measure).toHaveBeenCalledWith('timer', expect.anything());
    });
  });

  describe(TimingMeter.prototype.takeMeasurements, () => {
    it('returns list of measurement', () => {
      const entry1 = createEntry();
      const entry2 = createEntry();
      const entries = [entry1, entry2];
      jest
        .spyOn(window.performance, 'getEntriesByName')
        .mockReturnValueOnce(entries);

      expect(timer.takeMeasurements()).toBe(entries);
    });

    it('clears the measurement buffer', () => {
      timer.takeMeasurements();
      expect(clearMeasures).toHaveBeenCalledWith('timer');
    });
  });

  describe(TimingMeter.prototype.takeLastMeasurement, () => {
    it('returns the last recorded measurement', () => {
      const entry1 = createEntry();
      const entry2 = createEntry();
      jest
        .spyOn(window.performance, 'getEntriesByName')
        .mockReturnValueOnce([entry1, entry2]);

      expect(timer.takeLastMeasurement()).toBe(entry2);
    });

    it('clears the measurement buffer', () => {
      timer.takeLastMeasurement();
      expect(clearMeasures).toHaveBeenCalledWith('timer');
    });
  });
});

function createEntry(): PerformanceEntry {
  return {
    startTime: 0,
    duration: 0,
    entryType: 'mark',
    name: 'name',
    toJSON: jest.fn(),
  };
}
