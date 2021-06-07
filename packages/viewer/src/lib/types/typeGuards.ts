export function isPromise<T>(obj: any): obj is Promise<T> {
  return (
    obj != null &&
    obj['then'] instanceof Function &&
    obj['catch'] instanceof Function &&
    // NOTE: Should be removed if we do not target ES2018.
    obj['finally'] instanceof Function
  );
}
