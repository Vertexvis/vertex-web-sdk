import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { stampTemplateWithId } from '../../lib/templates';
import { DistanceMeasurement, Measurement } from '../../lib/types';
import { isVertexViewerDistanceMeasurement } from '../viewer-distance-measurement/utils';

/**
 * The types of measurements that can be performed by this tool.
 */
export type ViewerMeasurementToolType = 'distance' /* | 'angle' */;

interface StateMap {
  measurementElement?: HTMLVertexViewerDistanceMeasurementElement;
}

@Component({
  tag: 'vertex-viewer-measurement-tool',
  styleUrl: 'viewer-measurement-tool.css',
  shadow: true,
})
export class ViewerMeasurementTool {
  /**
   * An ID to an HTML template that describes the HTML content to use for
   * distance measurements. It's expected that the template contains a
   * `<vertex-viewer-distance-measurement>`.
   *
   * This property will automatically be set if a child of a
   * `<vertex-viewer-measurements>` element.
   */
  @Prop()
  public distanceTemplateId?: string;

  /**
   * The type of measurement.
   *
   * This property will automatically be set if a child of a
   * `<vertex-viewer-measurements>` element.
   */
  @Prop()
  public tool: ViewerMeasurementToolType = 'distance';

  /**
   * Disables measurements.
   *
   * This property will automatically be set if a child of a
   * `<vertex-viewer-measurements>` element.
   */
  @Prop()
  public disabled = false;

  /**
   * The viewer to connect to measurements.
   *
   * This property will automatically be set if a child of a
   * `<vertex-viewer-measurements>` or `<vertex-viewer>` element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * A property that indicates if the user is performing a measurement.
   */
  @Prop({ mutable: true, reflect: true })
  public isMeasuring = false;

  /**
   * An event that is dispatched when a user begins a new measurement.
   */
  @Event({ bubbles: true })
  public measureBegin!: EventEmitter<void>;

  /**
   * An event that is dispatched when a user has finished their measurement.
   */
  @Event({ bubbles: true })
  public measureEnd!: EventEmitter<Measurement>;

  @Element()
  private hostEl!: HTMLElement;

  /**
   * Captures internal state that you want to preserve across dev refreshes, but
   * don't want to trigger a render when the state changes.
   */
  @State()
  private stateMap: StateMap = {};

  @Watch('viewer')
  protected handleViewerChanged(): void {
    if (this.stateMap.measurementElement != null) {
      this.stateMap.measurementElement.viewer = this.viewer;
    }
  }

  /**
   * @ignore
   */
  @Watch('tool')
  protected handleToolChanged(): void {
    this.updateMeasurementElement();
  }

  /**
   * @ignore
   */
  @Watch('distanceTemplateId')
  protected handleDistanceTemplateIdChanged(): void {
    this.updateMeasurementElement();
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.updateMeasurementElement();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    if (!this.disabled) {
      if (this.tool === 'distance') {
        return (
          <Host>
            <vertex-viewer-layer>
              <slot />
            </vertex-viewer-layer>
          </Host>
        );
      } else {
        return <Host>{`Unsupported tool type '${this.tool}'.`}</Host>;
      }
    } else {
      return <Host></Host>;
    }
  }

  private createDistanceMeasurementElement(): HTMLVertexViewerDistanceMeasurementElement {
    if (this.distanceTemplateId != null) {
      const element = stampTemplateWithId(
        window.document.body,
        this.distanceTemplateId,
        isVertexViewerDistanceMeasurement,
        () =>
          console.warn(
            `Distance template with ID ${this.distanceTemplateId} not found. Using default distance element.`
          ),
        () =>
          console.warn(
            `Distance template does not contain a vertex-viewer-distance-measurement. Using default distance element.`
          )
      );

      if (element != null) {
        return element;
      }
    }

    return document.createElement('vertex-viewer-distance-measurement');
  }

  private updateMeasurementElement(): void {
    const { measurementElement } = this.stateMap;
    if (measurementElement != null) {
      measurementElement.remove();
      measurementElement.viewer = undefined;
      measurementElement.removeEventListener(
        'editBegin',
        this.handleMeasurementEditBegin
      );
      measurementElement.removeEventListener(
        'editEnd',
        this.handleMeasurementEditEnd
      );
    }

    const newMeasurementElement = this.createDistanceMeasurementElement();
    newMeasurementElement.mode = 'replace';
    newMeasurementElement.viewer = this.viewer;
    newMeasurementElement.addEventListener(
      'editBegin',
      this.handleMeasurementEditBegin
    );
    newMeasurementElement.addEventListener(
      'editEnd',
      this.handleMeasurementEditEnd
    );
    this.stateMap.measurementElement = newMeasurementElement;
    this.hostEl.append(newMeasurementElement);
  }

  private handleMeasurementEditBegin = (): void => {
    this.isMeasuring = true;
    this.measureBegin.emit();
  };

  private handleMeasurementEditEnd = (): void => {
    const { measurementElement } = this.stateMap;
    if (isVertexViewerDistanceMeasurement(measurementElement)) {
      const { start, end, invalid } = measurementElement;

      this.isMeasuring = false;
      measurementElement.start = undefined;
      measurementElement.end = undefined;

      if (start != null && end != null) {
        this.measureEnd.emit(new DistanceMeasurement({ start, end, invalid }));
      }
    }
  };
}
