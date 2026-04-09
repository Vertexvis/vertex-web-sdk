export function getWorkerSrc(): string {
  return new URL('./assets/pdf.worker.min.mjs', import.meta.url).toString();
}
