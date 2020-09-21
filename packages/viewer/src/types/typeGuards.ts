/* eslint-disable @typescript-eslint/ban-ts-comment */
export function isPromise<T>(obj: unknown): obj is Promise<T> {
  return (
    obj != null &&
    //@ts-ignore
    obj['then'] instanceof Function &&
    //@ts-ignore
    obj['catch'] instanceof Function &&
    // NOTE: Should be removed if we do not target ES2018.
    //@ts-ignore
    obj['finally'] instanceof Function
  );
}
/* eslint-enable @typescript-eslint/ban-ts-comment */
