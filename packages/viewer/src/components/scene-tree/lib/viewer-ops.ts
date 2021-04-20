import { ColorMaterial } from '../../..';

export interface SelectItemOptions {
  material?: string | ColorMaterial.ColorMaterial;
  append?: boolean;
}

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

export async function selectItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { material, append = false }: SelectItemOptions
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => [
      ...(append ? [] : [op.where((q) => q.all()).deselect()]),
      op.where((q) => q.withItemId(id)).select(material),
    ])
    .execute();
}

export async function deselectItem(
  viewer: HTMLVertexViewerElement,
  id: string
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => op.where((q) => q.withItemId(id)).deselect())
    .execute();
}
