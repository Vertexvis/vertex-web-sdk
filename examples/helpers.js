const DEFAULT_ENV = 'platprod';
const DEFAULT_STREAM_KEY = 'ocgUAlbpe5dWkOjkHjUWzv7Sm1qWJpTi9sa4';

export async function loadViewerWithQueryParams(
  viewer,
  { env, streamKey } = {
    streamKey: getStreamKey() || DEFAULT_STREAM_KEY,
    env: getEnvironment() || DEFAULT_ENV,
  }
) {
  viewer.configEnv = env;
  await viewer.load(`urn:vertex:stream-key:${streamKey}`);
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
