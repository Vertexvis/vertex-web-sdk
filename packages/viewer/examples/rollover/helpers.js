export async function loadViewerWithQueryParams(viewer) {
  const clientId = readDefaultClientId();
  const key = readDefaultStreamKey();
  viewer.setAttribute('client-id', clientId);
  console.log(readUrlParams());
  await viewer.load(`urn:vertexvis:stream-key:${key}`);
  console.log('loaded');
}

export function readDefaultClientId() {
  const urlParams = readUrlParams();

  return urlParams.clientid || '';
}

export function readDefaultStreamKey() {
  const urlParams = readUrlParams();

  return urlParams.streamkey || '';
}

export function readDebugFeatureMap() {
  const urlParams = readUrlParams();
  return urlParams.debugfeaturemap || '';
}

export function readSceneId() {
  const urlParams = readUrlParams();
  return urlParams.sceneid || '';
}

function readUrlParams() {
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
