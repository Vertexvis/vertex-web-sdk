export interface Animation {
  milliseconds: number;
}

export function create(data: Partial<Animation> = {}): Animation {
  return {
    milliseconds: data.milliseconds || 2000,
  };
}
