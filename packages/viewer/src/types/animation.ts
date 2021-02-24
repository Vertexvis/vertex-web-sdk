const DEFAULT_ANIMATION_DURATION = 500;

export interface Animation {
  milliseconds: number;
}

export function create(data: Partial<Animation> = {}): Animation {
  console.log(data);
  return {
    milliseconds: data.milliseconds || DEFAULT_ANIMATION_DURATION,
  };
}

export interface AnimationConfig {
  durationMs: number;
}

export const defaultAnimationConfig: AnimationConfig = {
  durationMs: DEFAULT_ANIMATION_DURATION,
};
