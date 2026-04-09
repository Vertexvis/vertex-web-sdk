export function getRelativeUrl(url: string): string {
  return new URL(url, import.meta.url).toString();
}

export function moduleUrlIncludes(string: string): boolean {
  return import.meta.url.includes(string);
}
