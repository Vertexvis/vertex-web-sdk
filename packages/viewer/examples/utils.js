export function getStreamKeyFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return params.get('streamKey');
}
