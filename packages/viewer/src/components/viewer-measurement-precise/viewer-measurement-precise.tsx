// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Host, h, Prop, Watch, State } from '@stencil/core';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { Disposable } from '@vertexvis/utils';
import { Config, parseConfig } from '../../lib/config';
import { Environment } from '../../lib/environment';
import {
  MeasurementController,
  MeasurementEntity,
  MeasurementModel,
} from '../../lib/measurement';
import { PreciseMeasurementInteractionHandler } from '../../lib/measurement/interactions';

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
  private entities: MeasurementEntity[] = [];

  private registeredInteractionHandler?: Promise<Disposable>;
  private onEntitiesChangedDisposable?: Disposable;

  protected componentWillLoad(): void {
    this.setupController();
    this.setupInteractionHandler();
    this.setupModelListeners();
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
        <vertex-viewer-dom-renderer viewer={this.viewer} drawMode="2d">
          {this.entities.map((e) => (
            <vertex-viewer-dom-element position={e.point}>
              <div class="hit-point" />
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
      () => this.viewer?.getJwt()
    );
  }

  private setupInteractionHandler(): void {
    this.registeredInteractionHandler?.then((handler) => handler.dispose());
    this.registeredInteractionHandler = undefined;

    if (this.measurementController != null) {
      this.registeredInteractionHandler =
        this.viewer?.registerInteractionHandler(
          new PreciseMeasurementInteractionHandler(this.measurementController)
        );
    }
  }

  private setupModelListeners(): void {
    this.onEntitiesChangedDisposable?.dispose();
    this.onEntitiesChangedDisposable = this.measurementModel?.onEntitiesChanged(
      this.handleEntitiesChanged
    );
  }

  private handleEntitiesChanged = (): void => {
    this.updateEntities();
  };

  private updateEntities(): void {
    this.entities = this.measurementModel?.getEntities() ?? [];
  }
}
