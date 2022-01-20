// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { Disposable } from '@vertexvis/utils';

import { Config, parseConfig } from '../../lib/config';
import { Environment } from '../../lib/environment';
import {
  ImpreciseMeasurementEntity,
  MeasurementController,
  MeasurementModel,
} from '../../lib/measurement';
import { MeasurementInteractionHandler } from '../../lib/measurement/interactions';

@Component({
  tag: 'vertex-viewer-measurement-precise',
  styleUrl: 'viewer-measurement-precise.css',
  shadow: true,
})
export class ViewerMeasurementPrecise {
  @Prop()
  public measurementModel: MeasurementModel = new MeasurementModel();

  @Prop({ mutable: true })
  public measurementController?: MeasurementController;

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Prop()
  public configEnv: Environment = 'platprod';

  @Prop()
  public config?: Config;

  @State()
  private impreciseEntities: ImpreciseMeasurementEntity[] = [];

  private registeredInteractionHandler?: Promise<Disposable>;
  private onEntitiesChangedHandler?: Disposable;

  protected connectedCallback(): void {
    this.setupInteractionHandler();
  }

  protected componentWillLoad(): void {
    this.setupController();
    this.setupModelListeners();
    this.setupInteractionHandler();
  }

  protected disconnectedCallback(): void {
    this.clearInteractionHandler();
    this.clearModelListeners();
  }

  @Watch('measurementController')
  protected handleMeasurementControllerChanged(): void {
    this.setupInteractionHandler();
  }

  @Watch('measurementModel')
  protected handleMeasurementModelChanged(): void {
    this.setupController();
    this.setupModelListeners();
  }

  @Watch('viewer')
  protected handleViewerChanged(): void {
    this.setupInteractionHandler();
  }

  public render(): JSX.Element {
    return (
      <Host>
        <vertex-viewer-dom-renderer drawMode="2d" viewer={this.viewer}>
          {this.impreciseEntities.map((e) => (
            <vertex-viewer-dom-element position={e.point}>
              <div class="imprecise-anchor" />
            </vertex-viewer-dom-element>
          ))}
        </vertex-viewer-dom-renderer>
      </Host>
    );
  }

  private setupController(): void {
    const config = parseConfig(this.configEnv, this.config);
    const client = new SceneViewAPIClient(config.network.sceneViewHost);
    this.measurementController = new MeasurementController(
      this.measurementModel,
      client,
      () => this.viewer?.token,
      this.viewer?.deviceId
    );
  }

  private clearInteractionHandler(): void {
    this.registeredInteractionHandler?.then((handler) => handler.dispose());
    this.registeredInteractionHandler = undefined;
  }

  private setupInteractionHandler(): void {
    this.clearInteractionHandler();

    if (this.measurementController != null) {
      this.registeredInteractionHandler =
        this.viewer?.registerInteractionHandler(
          new MeasurementInteractionHandler(this.measurementController)
        );
    }
  }

  private clearModelListeners(): void {
    this.onEntitiesChangedHandler?.dispose();
    this.onEntitiesChangedHandler = undefined;
  }

  private setupModelListeners(): void {
    this.onEntitiesChangedHandler = this.measurementModel.onEntitiesChanged(
      () => {
        this.impreciseEntities = this.measurementModel.getImpreciseEntities();
      }
    );
  }
}
