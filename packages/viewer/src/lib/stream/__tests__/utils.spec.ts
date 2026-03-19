import { retryIfNotAborted } from '../utils';

describe('Stream utils', () => {
  describe('retryIfNotAborted', () => {
    it('calls the provided function if not aborted', async () => {
      const abortController = new AbortController();
      const callback = jest
        .fn()
        .mockRejectedValueOnce(new Error())
        .mockRejectedValueOnce(new Error())
        .mockRejectedValueOnce(new Error())
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce('resolve');

      const result = await retryIfNotAborted(
        abortController.signal,
        callback,
        'default',
        {
          maxRetries: 100,
        }
      );

      expect(callback).toHaveBeenCalledTimes(5);
      expect(result).toBe('resolve');
    });

    it('does not retry if the signal has been aborted', async () => {
      const abortController = new AbortController();
      const callback = jest
        .fn()
        .mockRejectedValueOnce(new Error())
        .mockImplementationOnce(() => {
          abortController.abort();

          throw new Error();
        })
        .mockRejectedValue(new Error());

      const result = await retryIfNotAborted(
        abortController.signal,
        callback,
        'default',
        {
          maxRetries: 100,
        }
      );

      expect(callback).toHaveBeenCalledTimes(2);
      expect(result).toBe('default');
    });
  });
});
