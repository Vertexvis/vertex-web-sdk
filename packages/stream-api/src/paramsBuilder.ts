export type ParamsBuilder<S> = (settings: S) => Record<string, string>;

export function defineParams<S>(
  ...definitions: ParamsBuilder<S>[]
): ParamsBuilder<S> {
  return settings => {
    return definitions.reduce(
      (result, def) => ({ ...result, ...def(settings) }),
      {}
    );
  };
}

export function defineBoolean<S, P extends keyof S = keyof S>(
  param: string,
  prop: P
): ParamsBuilder<S> {
  return defineValue(param, prop, v => {
    if (typeof v === 'boolean') {
      return v ? 'on' : 'off';
    } else {
      return undefined;
    }
  });
}

export function defineNumber<S, P extends keyof S = keyof S>(
  param: string,
  prop: P
): ParamsBuilder<S> {
  return defineValue(param, prop, v =>
    typeof v === 'number' ? v.toString() : undefined
  );
}

export function defineString<S, P extends keyof S = keyof S>(
  param: string,
  prop: P
): ParamsBuilder<S> {
  return defineValue(param, prop, v => (typeof v === 'string' ? v : undefined));
}

function defineValue<S, P extends keyof S = keyof S>(
  param: string,
  prop: P,
  f: (prop: unknown) => string | undefined
): ParamsBuilder<S> {
  return settings => {
    const value = f(settings[prop]);
    if (value != null) {
      return { [param]: value };
    } else {
      return {};
    }
  };
}
