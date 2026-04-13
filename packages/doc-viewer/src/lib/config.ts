import { DeepPartial } from '@vertexvis/utils';

export interface PdfJsConfig {
  workerSrc: string;
}

export interface Config {
  pdfJs: PdfJsConfig;
}

export type PartialConfig = DeepPartial<Config>;
