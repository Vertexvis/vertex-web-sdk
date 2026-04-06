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

  /**
   * Returns a boolean indicating whether the document supports layers.
   */
  public get enabled(): boolean {
    return this.apiSupportsLayers;
  }

  /**
   * Retrieves the layers of the document.
   *
   * @throws {Error} if the loaded document does not support layers.
   */
  public async getLayers(): Promise<DocumentLayer[]> {
    return this.getApi().getLayers();
  }

  /**
   * Sets the visibility of a layer by ID.
   *
   * @throws {Error} if the loaded document does not support layers.
   */
  public async setLayerVisibility(id: string, visible: boolean): Promise<void> {
    return this.getApi().setLayerVisibility(id, visible);
  }

  private getApi(): LayerSupportedApi {
    if (this.api == null) {
      throw new Error('The current document does not support layers.');
    }
    return this.api;
  }
}
