import { DocumentApi } from '../api';

export interface DocumentLayer {
  readonly id: string;
  readonly name: string;
  readonly visible: boolean;
}

export interface LayerSupport {
  readonly getLayers: () => DocumentLayer[] | Promise<DocumentLayer[]>;
  readonly setLayerVisibility: (id: string, visible: boolean) => void | Promise<void>;
}

export type LayerSupportedApi = DocumentApi & LayerSupport;

export function apiSupportsLayers(api: DocumentApi): api is LayerSupportedApi {
  return api != null && typeof (api as LayerSupportedApi).getLayers === 'function' && typeof (api as LayerSupportedApi).setLayerVisibility === 'function';
}
