export type KeyState = Record<string, boolean>;

export interface KeyInteraction<T = undefined> {
  predicate(detail: T): boolean;
  fn(detail: T): void | Promise<void>;
}
