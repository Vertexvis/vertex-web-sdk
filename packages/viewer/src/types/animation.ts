export interface Animation {
  milliseconds?: number;
  easing?:
    | 'linear'
    | 'ease-out-cubic'
    | 'ease-out-quad'
    | 'ease-out-quart'
    | 'ease-out-sine'
    | 'ease-out-expo';
}

export function create(data: Partial<Animation> = {}): Animation {
  return {
    milliseconds: data.milliseconds || undefined,
    easing: data.easing || undefined,
  };
}
