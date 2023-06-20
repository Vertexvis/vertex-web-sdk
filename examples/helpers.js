export async function loadViewerWithQueryParams(viewer) {
  const key = readDefaultStreamKey();
  await viewer.load(`urn:vertexvis:stream-key:${key}`);
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
