import { SynchronizedClock } from '../synchronizedClock';

describe(SynchronizedClock, () => {
  const localTime = new Date('2020-08-01T17:00:00.000Z');
  const remoteTime = new Date('2020-08-01T17:00:01.000Z');
  const localNow = new Date('2020-08-01T17:00:02.000Z');

  const clock = new SynchronizedClock(remoteTime, localTime);

  afterEach(() => jest.restoreAllMocks());

  describe(SynchronizedClock.prototype.localOffset, () => {
    it('returns local offset from when clock was instantiated', () => {
      jest.spyOn(global.Date, 'now').mockReturnValue(localNow.getTime());

      const offset = clock.localOffset();
      expect(offset).toBe(2000);
    });
  });

  describe(SynchronizedClock.prototype.localTime, () => {
    it('approximates local time from a remote timestamp', () => {
      const local = clock.localTime(remoteTime);
      expect(local.getTime()).toBe(localTime.getTime());
    });

    it('approximates local time from remote offset duration', () => {
      const local = clock.localTime(1000);
      expect(local.getTime()).toBe(localTime.getTime());
    });
  });

  describe(SynchronizedClock.prototype.remoteTime, () => {
    it('approximates remote time from a local timestamp', () => {
      const remote = clock.remoteTime(localTime);
      expect(remote.getTime()).toBe(remoteTime.getTime());
    });

    it('approximates remote time from local offset duration', () => {
      const remote = clock.remoteTime(0);
      expect(remote.getTime()).toBe(remoteTime.getTime());
    });
  });

  describe(SynchronizedClock.prototype.remoteNow, () => {
    it('approximates the current time on the remote', () => {
      jest.spyOn(global.Date, 'now').mockReturnValue(localNow.getTime());

      const remote = clock.remoteNow();
      const expected = localNow.getTime() + 1000;
      expect(remote.getTime()).toBe(expected);
    });
  });

  describe(SynchronizedClock.prototype.remoteOffset, () => {
    it('approximates the current offset on the remote', () => {
      const remoteOffset = clock.remoteOffset(localTime);
      expect(remoteOffset).toBe(0);
    });
  });
});
