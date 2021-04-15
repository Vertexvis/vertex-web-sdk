export async function showItem(
  viewer: HTMLVertexViewerElement,
  id: string
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => op.where((q) => q.withItemId(id)).show())
    .execute();
}

export async function hideItem(
  viewer: HTMLVertexViewerElement,
  id: string
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => op.where((q) => q.withItemId(id)).hide())
    .execute();
}
