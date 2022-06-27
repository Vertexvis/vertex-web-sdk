import { ColorMaterial } from '../../..';

export interface ViewerItemOptions {
  material?: string | ColorMaterial.ColorMaterial;
  append?: boolean;
  range?: boolean;
  suppliedCorrelationId?: string;
}

export async function showItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { suppliedCorrelationId }: ViewerItemOptions = {}
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => op.where((q) => q.withItemId(id)).show())
    .execute({ suppliedCorrelationId });
}

export async function hideItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { suppliedCorrelationId }: ViewerItemOptions = {}
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => op.where((q) => q.withItemId(id)).hide())
    .execute({
      suppliedCorrelationId,
    });
}

export async function selectItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { material, append = false, suppliedCorrelationId }: ViewerItemOptions
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => [
      ...(append ? [] : [op.where((q) => q.all()).deselect()]),
      op.where((q) => q.withItemId(id)).select(material),
    ])
    .execute({ suppliedCorrelationId });
}

export async function selectRangeInSceneTree(
  viewer: HTMLVertexViewerElement,
  start: number,
  end: number,
  { material, append = true, suppliedCorrelationId }: ViewerItemOptions
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => [
      ...(append ? [] : [op.where((q) => q.all()).deselect()]),
      op.where((q) => q.withSceneTreeRange({ start, end })).select(material),
    ])
    .execute({
      suppliedCorrelationId,
    });
}

export async function selectFilterResults(
  viewer: HTMLVertexViewerElement,
  filter: string,
  keys: string[],
  exactMatch: boolean,
  {
    material = undefined,
    append = false,
    suppliedCorrelationId,
  }: ViewerItemOptions
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => [
      ...(append ? [] : [op.where((q) => q.all()).deselect()]),
      op
        .where((q) => q.withMetadata(filter, keys, exactMatch))
        .select(material),
    ])
    .execute({
      suppliedCorrelationId,
    });
}

export async function deselectItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { suppliedCorrelationId }: ViewerItemOptions = {}
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .items((op) => op.where((q) => q.withItemId(id)).deselect())
    .execute({
      suppliedCorrelationId,
    });
}
