import { BomItemQuery } from './bomQuery';

export interface ClearHighlightAll {
  type: 'clear_highlight_all';
}

export interface ShowAll {
  type: 'show_all';
}

export interface HideAll {
  type: 'hide_all';
}

export interface CloneSceneState {
  type: 'clone_scene_state';
}

export interface Hide {
  type: 'hide';
}

export interface Highlight {
  type: 'highlight';
  hexColorString: string;
}

export interface Show {
  type: 'show';
}

export interface ShowOnly {
  type: 'show_only';
}

export type BomOperation =
  | ClearHighlightAll
  | ShowAll
  | HideAll
  | CloneSceneState
  | Hide
  | Highlight
  | Show
  | ShowOnly;

export interface BulkBomOperation {
  bomOperations: BomOperation[];
  bomItemQuery: BomItemQuery;
}
