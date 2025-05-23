export const DEFAULT_SCENE_TREE_OP_ANIMATION_MS = 500;

export interface ViewerItemOptions {
  suppliedCorrelationId?: string;
}
export interface ViewerSelectItemOptions extends ViewerItemOptions {
  append?: boolean;
  range?: boolean;
}
export interface ViewerIsolateItemOptions extends ViewerItemOptions {
  animationDurationMs?: number;
}

export async function showItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { suppliedCorrelationId }: ViewerItemOptions = {}
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .elements((op) => op.items.where((q) => q.withItemId(id)).show())
    .execute({ suppliedCorrelationId });
}

export async function hideItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { suppliedCorrelationId }: ViewerItemOptions = {}
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .elements((op) => op.items.where((q) => q.withItemId(id)).hide())
    .execute({
      suppliedCorrelationId,
    });
}

export async function selectItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { append = false, suppliedCorrelationId }: ViewerSelectItemOptions
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .elements((op) => [
      ...(append ? [] : [op.items.where((q) => q.all()).deselect()]),
      op.items.where((q) => q.withItemId(id)).select(),
    ])
    .execute({ suppliedCorrelationId });
}

export async function selectRangeInSceneTree(
  viewer: HTMLVertexViewerElement,
  start: number,
  end: number,
  { append = true, suppliedCorrelationId }: ViewerSelectItemOptions
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .elements((op) => [
      ...(append ? [] : [op.items.where((q) => q.all()).deselect()]),
      op.items.where((q) => q.withSceneTreeRange({ start, end })).select(),
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
  removeHiddenResults: boolean,
  { append = false, suppliedCorrelationId }: ViewerSelectItemOptions
): Promise<void> {
  const scene = await viewer.scene();
  return scene
    .elements((op) => [
      ...(append ? [] : [op.items.where((q) => q.all()).deselect()]),
      op.items
        .where((q) =>
          q.withMetadata(filter, keys, exactMatch, removeHiddenResults)
        )
        .select(),
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
    .elements((op) => op.items.where((q) => q.withItemId(id)).deselect())
    .execute({
      suppliedCorrelationId,
    });
}

export async function isolateItem(
  viewer: HTMLVertexViewerElement,
  id: string,
  { suppliedCorrelationId, animationDurationMs }: ViewerIsolateItemOptions = {}
): Promise<void> {
  const scene = await viewer.scene();
  await scene
    .elements((op) => [
      op.items.where((q) => q.all()).hide(),
      op.items.where((q) => q.withItemId(id)).show(),
    ])
    .execute({
      suppliedCorrelationId,
    });
  const renderResult = await scene
    .camera()
    .flyTo((q) => q.withItemId(id))
    .render({
      animation: {
        milliseconds: animationDurationMs ?? DEFAULT_SCENE_TREE_OP_ANIMATION_MS,
      },
    });
  await renderResult.onAnimationCompleted.once();
}
