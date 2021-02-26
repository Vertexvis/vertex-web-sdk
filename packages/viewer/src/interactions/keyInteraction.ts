export type KeyState = Record<string, boolean>;

export interface KeyInteraction<T = undefined> {
  predicate(keyState: KeyState): boolean;
  fn(detail: T): void | Promise<void>;
}

export interface KeyInteractionWithReset extends KeyInteraction {
  reset(): void | Promise<void>;
}
