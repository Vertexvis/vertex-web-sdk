const DEFAULT_ENV = 'platprod';
const DEFAULT_STREAM_KEY = 'ydD87RtDdJCZQaa6twueZTEtsciQmAWl5qnP';

export async function loadViewerWithQueryParams(viewer, options) {
  const effectiveStreamKey =
    options?.streamKey ?? getStreamKey() ?? DEFAULT_STREAM_KEY;
  const effectiveEnv = options?.env ?? getEnvironment() ?? DEFAULT_ENV;

  viewer.configEnv = effectiveEnv;
  await viewer.load(`urn:vertex:stream-key:${effectiveStreamKey}`);
}

export function getStreamKey() {
  const urlParams = getUrlPParams();
  return urlParams.streamkey;
}

export function getEnvironment() {
  const urlParams = getUrlPParams();
  return urlParams.env;
}

function getUrlPParams() {
  return window.location.search
    .slice(1, window.location.search.length)
    .split('&')
    .reduce((result, value) => {
      const param = value.split(/=(.+)/, 2);

      return {
        ...result,
        [param[0].replace('-', '').toLowerCase()]: param[1],
      };
    }, {});
}
