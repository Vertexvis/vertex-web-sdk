jest.mock('../../../imports', () => ({
  getRelativeUrl: jest.fn(),
  moduleUrlIncludes: jest.fn(),
}));

import { getRelativeUrl, moduleUrlIncludes } from '../../../imports';
import { getBuildTypeWorkerSrcCandidateProviders, getWorkerSrc, WORKER_ABSOLUTE_PATH } from '../worker-src';

describe(getWorkerSrc, () => {
  const fetchMock = jest.fn();
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;

    global.fetch = fetchMock;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should try multiple sources and return the first one that is successful', async () => {
    (getRelativeUrl as jest.Mock).mockReturnValue('url');
    (moduleUrlIncludes as jest.Mock).mockReturnValue(true);

    fetchMock.mockResolvedValueOnce({ ok: false });
    fetchMock.mockResolvedValueOnce({ ok: false });
    fetchMock.mockResolvedValueOnce({ ok: true });

    const workerSrc = await getWorkerSrc();

    expect(workerSrc).toBe(WORKER_ABSOLUTE_PATH);
  });

  it('simply returns any worker source if a config is provided', async () => {
    const workerSrc = await getWorkerSrc({ pdfJs: { workerSrc: 'url' } });

    expect(workerSrc).toBe('url');
  });
});

describe(getBuildTypeWorkerSrcCandidateProviders, () => {
  it('should return the correct candidate providers for an esm build', () => {
    (getRelativeUrl as jest.Mock).mockReturnValueOnce('parent-url');
    (getRelativeUrl as jest.Mock).mockReturnValueOnce('relative-url');
    (moduleUrlIncludes as jest.Mock).mockReturnValueOnce(true);
    (moduleUrlIncludes as jest.Mock).mockReturnValue(false);

    const candidateProviders = getBuildTypeWorkerSrcCandidateProviders();

    expect(candidateProviders).toHaveLength(3);
    expect(candidateProviders[0]()).toBe('parent-url');
    expect(candidateProviders[1]()).toBe('relative-url');
    expect(candidateProviders[2]()).toBe(WORKER_ABSOLUTE_PATH);
  });

  it('should return the correct candidate providers for a dist build', () => {
    (getRelativeUrl as jest.Mock).mockReturnValueOnce('relative-url');
    (getRelativeUrl as jest.Mock).mockReturnValueOnce('parent-url');
    (moduleUrlIncludes as jest.Mock).mockReturnValueOnce(false);
    (moduleUrlIncludes as jest.Mock).mockReturnValueOnce(false);
    (moduleUrlIncludes as jest.Mock).mockReturnValue(true);

    const candidateProviders = getBuildTypeWorkerSrcCandidateProviders();

    expect(candidateProviders).toHaveLength(3);
    expect(candidateProviders[0]()).toBe(WORKER_ABSOLUTE_PATH);
    expect(candidateProviders[1]()).toBe('relative-url');
    expect(candidateProviders[2]()).toBe('parent-url');
  });

  it('should return the correct candidate providers for a custom element build', () => {
    (getRelativeUrl as jest.Mock).mockReturnValueOnce('relative-url');
    (getRelativeUrl as jest.Mock).mockReturnValueOnce('parent-url');
    (moduleUrlIncludes as jest.Mock).mockReturnValueOnce(false);
    (moduleUrlIncludes as jest.Mock).mockReturnValueOnce(true);
    (moduleUrlIncludes as jest.Mock).mockReturnValue(false);

    const candidateProviders = getBuildTypeWorkerSrcCandidateProviders();

    expect(candidateProviders).toHaveLength(3);
    expect(candidateProviders[0]()).toBe('relative-url');
    expect(candidateProviders[1]()).toBe('parent-url');
    expect(candidateProviders[2]()).toBe(WORKER_ABSOLUTE_PATH);
  });
});
