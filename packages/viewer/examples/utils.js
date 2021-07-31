export function getStreamKeyFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return params.get('streamKey');
}

export async function addGeometryLoaderMeshes(renderer, parent, meshes) {
  for await (const m of meshes) {
    for (const mesh of m) {
      parent.add(mesh);
    }
    renderer.draw();
  }
}
