export function writeDOM(f: () => void): void {
  setTimeout(() => f(), 0);
}

export function readDOM(f: () => void): void {
  setTimeout(() => f(), 0);
}
