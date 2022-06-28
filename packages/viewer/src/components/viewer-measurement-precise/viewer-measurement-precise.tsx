// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { Disposable } from '@vertexvis/utils';

import { Config, parseConfig } from '../../lib/config';
import { Environment } from '../../lib/environment';
import {
  MeasurementController,
  MeasurementModel,
  MeasurementOverlayManager,
} from '../../lib/measurement';
import { MeasurementInteractionHandler } from '../../lib/measurement/interactions';
import { EntityType } from '../../lib/types';

@Component({
  tag: 'vertex-viewer-measurement-precise',
  styleUrl: 'viewer-measurement-precise.css',
  shadow: true,
})
export class ViewerMeasurementPrecise {
  /**
   * The model that contains the entities and outcomes from performing precise
   * measurements.
   */
  @Prop()
  public measurementModel: MeasurementModel = new MeasurementModel();

  /**
   * The manager that is responsible for measurement overlays to present by this
   * component.
   */
  @Prop()
  public measurementOverlays: MeasurementOverlayManager = new MeasurementOverlayManager();

  /**
   * The controller that is responsible for performing measurements and updating
   * the model.
   */
  @Prop({ mutable: true })
  public measurementController?: MeasurementController;

  /**
   * @internal
   *
   * An internal property that can be used to opt-in to performing measurements
   * on other types of entities.
   */
  @Prop()
  public measurableEntityTypes: EntityType[] = [
    EntityType.PRECISE_SURFACE,
    EntityType.IMPRECISE_SURFACE,
  ];

  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The environment that will be used to request measurement results.
   */
  @Prop()
  public configEnv: Environment = 'platprod';

  /**
   * An optional configuration to setup network configuration of measurement
   * endpoints.
   */
  @Prop()
  public config?: Config | string;

  private registeredInteractionHandler?: Promise<Disposable>;

  /**
   * @ignore
   */
  protected connectedCallback(): void {
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.setupController();
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  protected disconnectedCallback(): void {
    this.clearInteractionHandler();
  }

  /**
   * @ignore
   */
  @Watch('measurableEntityTypes')
  protected handleMeasurableEntityTypesChanged(): void {
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  @Watch('measurementController')
  protected handleMeasurementControllerChanged(): void {
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  @Watch('measurementModel')
  protected handleMeasurementModelChanged(): void {
    this.setupController();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(): void {
    this.setupInteractionHandler();
  }

  /**
   * @ignore
   */
  protected render(): JSX.Element {
    return (
      <Host>
        <vertex-viewer-measurement-overlays
          viewer={this.viewer}
          measurementOverlays={this.measurementOverlays}
        />
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
          new MeasurementInteractionHandler(
            this.measurementController,
            this.measurableEntityTypes
          )
        );
    }
  }
}
