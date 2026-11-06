const DEFAULT_ENV = 'platprod';
const DEFAULT_STREAM_KEY = 'ydD87RtDdJCZQaa6twueZTEtsciQmAWl5qnP';

const fileStreamKey = nonEmpty(import.meta.env.VITE_STREAM_KEY);
const fileEnv = nonEmpty(import.meta.env.VITE_CONFIG_ENV);

export async function loadViewerWithQueryParams(viewer, options) {
  const queryStreamKey = nonEmpty(getStreamKey());
  const queryEnv = nonEmpty(getEnvironment());
  const usingFileStreamKey =
    options?.streamKey == null &&
    queryStreamKey == null &&
    fileStreamKey != null;

  const effectiveStreamKey =
    options?.streamKey ?? queryStreamKey ?? fileStreamKey ?? DEFAULT_STREAM_KEY;
  const effectiveEnv =
    options?.env ??
    queryEnv ??
    (usingFileStreamKey ? fileEnv : undefined) ??
    DEFAULT_ENV;

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

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined;
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
