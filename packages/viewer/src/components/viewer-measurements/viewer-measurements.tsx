import {
  Component,
  Host,
  h,
  Element,
  Prop,
  Watch,
  EventEmitter,
  Event,
  Method,
} from '@stencil/core';
import { UUID } from '@vertexvis/utils';
import { Vector3 } from '@vertexvis/geometry';

export type ViewerMeasurementType = 'distance';

export interface AddMeasurementData {
  start: Vector3.Vector3;
  end: Vector3.Vector3;
  type: ViewerMeasurementType;
  id?: string;
}

@Component({
  tag: 'vertex-viewer-measurements',
  styleUrl: 'viewer-measurements.css',
  shadow: true,
})
export class ViewerMeasurements {
  @Prop()
  public tool: ViewerMeasurementType = 'distance';

  @Prop()
  public interactionOn = false;

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Prop({ mutable: true })
  public selectedMeasurementId?: string;

  @Event()
  public measurementAdded!: EventEmitter<HTMLVertexViewerDistanceMeasurementElement>;

  @Event()
  public measurementRemoved!: EventEmitter<HTMLVertexViewerDistanceMeasurementElement>;

  @Element()
  private hostEl!: HTMLElement;

  private measurementToolsEl?: HTMLElement;

  @Method()
  public async addMeasurement(
    data: AddMeasurementData
  ): Promise<HTMLVertexViewerDistanceMeasurementElement> {
    if (data.type === 'distance') {
      const measurement = this.createDistanceMeasurement();
      measurement.start = data.start;
      measurement.end = data.end;
      measurement.viewer = this.viewer;
      measurement.id = data.id ?? `measurement-${UUID.create()}`;
      this.hostEl.appendChild(measurement);
      this.measurementAdded.emit(measurement);
      return measurement;
    } else {
      throw new Error(`Cannot add measurement. Unknown type '${data.type}'.`);
    }
  }

  @Method()
  public async removeMeasurement(
    id: string
  ): Promise<HTMLVertexViewerDistanceMeasurementElement | undefined> {
    const measurements = await this.getMeasurements();
    const measurement = measurements.find((m) => m.id === id);

    if (measurement != null) {
      measurement.remove();
      this.measurementRemoved.emit(measurement);
    }

    return measurement;
  }

  @Method()
  public async getMeasurements(): Promise<
    HTMLVertexViewerDistanceMeasurementElement[]
  > {
    return this.internalGetMeasurements();
  }

  private internalGetMeasurements(): HTMLVertexViewerDistanceMeasurementElement[] {
    const measurements = this.hostEl.querySelectorAll(
      'vertex-viewer-distance-measurement:not([data-is-tool])'
    );
    return Array.from(measurements).filter(isVertexViewerDistanceMeasurement);
  }

  protected componentDidLoad(): void {
    this.populateMeasurementTool();
  }

  @Watch('tool')
  protected handleToolChanged(): void {
    this.populateMeasurementTool();
  }

  @Watch('interactionOn')
  protected handleInteractionOnChanged(): void {
    this.populateMeasurementTool();
  }

  @Watch('selectedMeasurementId')
  protected handleSelectedMeasurementIdChanged(): void {
    const measurements = this.internalGetMeasurements();
    measurements.forEach((m) => {
      if (isVertexViewerDistanceMeasurement(m)) {
        m.mode = m.id === this.selectedMeasurementId ? 'edit' : '';
      }
    });
  }

  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <vertex-viewer-layer ref={(el) => (this.measurementToolsEl = el)} />
        <div id="measurements">
          <slot />
        </div>
      </Host>
    );
  }

  @Watch('viewer')
  protected handleViewerChanged(
    newViewer: HTMLVertexViewerElement | undefined
  ): void {
    Array.from(this.measurementToolsEl?.children || []).forEach((el) => {
      if (isVertexViewerDistanceMeasurement(el)) {
        const element = el as HTMLVertexViewerDistanceMeasurementElement;
        element.viewer = newViewer;
      }
    });
  }

  private handleMeasurementEditEnd = async (event: Event): Promise<void> => {
    const measurement = event.target as HTMLVertexViewerDistanceMeasurementElement;

    if (measurement.distance != null && measurement.distance > 0) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      const newMeasurement = await this.addMeasurement({
        type: 'distance',
        start: measurement.start!,
        end: measurement.end!,
      });
      /* eslint-enable @typescript-eslint/no-non-null-assertion */

      newMeasurement.addEventListener('pointerdown', (event) => {
        // Prevent the viewer from handling this event.
        event.stopPropagation();
        this.selectedMeasurementId = newMeasurement.id;
      });

      this.selectedMeasurementId = newMeasurement.id;
    }

    measurement.start = undefined;
    measurement.end = undefined;
  };

  private populateMeasurementTool(): void {
    if (this.measurementToolsEl != null) {
      const tool = this.hostEl.querySelector('#distance-measurement-tool');
      tool?.remove();

      if (this.interactionOn) {
        const measurement = this.createDistanceMeasurement();
        measurement.addEventListener('editEnd', this.handleMeasurementEditEnd);
        measurement.dataset.isTool = '';
        measurement.mode = 'replace';
        measurement.viewer = this.viewer;
        this.hostEl.prepend(measurement);
      }
    }
  }

  private createDistanceMeasurement(): HTMLVertexViewerDistanceMeasurementElement {
    const template = this.hostEl.querySelector('#distance-measurement');

    if (template instanceof HTMLTemplateElement) {
      const fragment = template.content.cloneNode(true) as HTMLElement;
      const element = fragment.firstElementChild;
      if (isVertexViewerDistanceMeasurement(element)) {
        return element;
      } else {
        throw new Error(
          'Expected template with ID `distance-measurement` to contain HTMLVertexViewerDistanceMeasurementElement.'
        );
      }
    } else if (template == null) {
      return document.createElement('vertex-viewer-distance-measurement');
    } else {
      throw new Error(
        'Expected element with ID `distance-measurement` to be HTMLTemplateElement.'
      );
    }
  }
}

function isVertexViewerDistanceMeasurement(
  el: unknown
): el is HTMLVertexViewerDistanceMeasurementElement {
  return (
    el instanceof HTMLElement &&
    el.nodeName === 'VERTEX-VIEWER-DISTANCE-MEASUREMENT'
  );
}
