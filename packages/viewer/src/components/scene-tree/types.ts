import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';

import { Row } from './lib';
import { ViewerSelectItemOptions } from './lib/viewer-ops';

export const SCENE_ITEM_NAME_METADATA_KEY = 'VERTEX_SCENE_ITEM_NAME';

export type MetadataKey = string;

export type RowDataProvider = (row: Row) => Record<string, unknown>;

export type RowArg = number | Row | Node.AsObject;

export interface FilterOptions {
  metadataSearchKeys?: MetadataKey[];
  exactMatch?: boolean;
  removeHiddenItems?: boolean;
}

/**
 * A set of options to configure the scroll to index behavior.
 */
export interface ScrollToOptions {
  /**
   * Indicates if this operation will be animated. Defaults to `false`.
   */
  animate?: boolean;

  /**
   * Indicates where in the viewport the scrolled to item should be placed.
   * Defaults to `middle`.
   */
  position?: 'start' | 'middle' | 'end';
}

export interface SceneTreeOperationOptions {
  suppliedCorrelationId?: string;
}

/**
 * A set of options to configure selection behavior.
 */
export interface SelectItemOptions extends ViewerSelectItemOptions {
  /**
   * Specifies that the next deselected ancestor node should be selected.
   */
  recurseParent?: boolean;
}
