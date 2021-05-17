export async function loadViewerWithQueryParams(viewer) {
  const clientId = readDefaultClientId();
  const key = readDefaultStreamKey();
  viewer.setAttribute('client-id', clientId);
  await viewer.load(`urn:vertexvis:stream-key:${key}`);
}

export function readDefaultClientId() {
  const urlParams = readUrlParams();

  return urlParams.clientid || '';
}

export function readDefaultStreamKey() {
  const urlParams = readUrlParams();

  return urlParams.streamkey || '';
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
