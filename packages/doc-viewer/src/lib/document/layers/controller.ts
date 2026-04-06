import { DocumentApi } from '../api';
import { apiSupportsLayers, DocumentLayer, LayerSupportedApi } from './types';

export class DocumentLayersController {
  private apiSupportsLayers = false;
  private api?: LayerSupportedApi;

  public constructor(api: DocumentApi) {
    if (apiSupportsLayers(api)) {
      this.apiSupportsLayers = true;
      this.api = api as LayerSupportedApi;
    }
  }

  public get enabled(): boolean {
    return this.apiSupportsLayers;
  }

  public async getLayers(): Promise<DocumentLayer[]> {
    return this.getApi().getLayers();
  }

  public async setLayerVisibility(layerId: string, visible: boolean): Promise<void> {
    return this.getApi().setLayerVisibility(layerId, visible);
  }

  private getApi(): LayerSupportedApi {
    if (this.api == null) {
      throw new Error('The current document does not support layers.');
    }
    return this.api;
  }
}
