export type ParamsBuilder<S> = (settings: S) => Record<string, string>;

export function defineParams<S>(
  ...definitions: Array<ParamsBuilder<S>>
): ParamsBuilder<S> {
  return (settings) =>
    Object.assign({}, ...definitions.map((def) => def(settings)));
}

type KeysOfType<S, V> = {
  [K in keyof S]-?: NonNullable<S[K]> extends V ? K : never;
}[keyof S];

export function defineBoolean<
  S,
  P extends KeysOfType<S, boolean> = KeysOfType<S, boolean>,
>(param: string, prop: P): ParamsBuilder<S> {
  return defineValue(param, prop, (v) =>
    typeof v === 'boolean' ? (v ? 'on' : 'off') : undefined,
  );
}

export function defineNumber<
  S,
  P extends KeysOfType<S, number> = KeysOfType<S, number>,
>(param: string, prop: P): ParamsBuilder<S> {
  return defineValue(param, prop, (v) =>
    typeof v === 'number' ? String(v) : undefined,
  );
}

export function defineString<
  S,
  P extends KeysOfType<S, string> = KeysOfType<S, string>,
>(param: string, prop: P): ParamsBuilder<S> {
  return defineValue(param, prop, (v) =>
    typeof v === 'string' ? v : undefined,
  );
}

function defineValue<S, P extends keyof S = keyof S>(
  param: string,
  prop: P,
  f: (prop: unknown) => string | undefined,
): ParamsBuilder<S> {
  return (settings) => {
    const value = f(settings[prop]);
    if (value != null) {
      return { [param]: value };
    } else {
      return {};
    }
  };
}
