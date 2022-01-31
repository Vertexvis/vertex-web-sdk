import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import { Formatter } from '../../lib/formatter';
import {
  MeasurementModel,
  MeasurementOverlay,
  MeasurementOverlayManager,
  MeasurementResult,
} from '../../lib/measurement';
import {
  AngleUnits,
  AngleUnitType,
  AreaUnits,
  DistanceUnits,
  DistanceUnitType,
  Unit,
} from '../../lib/types';
import {
  MinimumDistanceResultEntry,
  PlanarAngleResultEntry,
  PlanarDistanceResultEntry,
  SurfaceAreaResultEntry,
} from './viewer-measurement-details-results';

@Component({
  tag: 'vertex-viewer-measurement-details',
  styleUrl: 'viewer-measurement-details.css',
  shadow: true,
})
export class ViewerMeasurementDetails {
  /**
   * The `MeasurementModel` that should be reflected in these details.
   * If not specified, a new `MeasurementModel` will be created,
   * which can then be used to update the display.
   */
  @Prop()
  public measurementModel: MeasurementModel = new MeasurementModel();

  /**
   * The manager that the component will use to present measurement overlays.
   */
  @Prop()
  public measurementOverlays?: MeasurementOverlayManager;

  /**
   * The unit of distance-based measurement.
   */
  @Prop()
  public distanceUnits: DistanceUnitType = 'millimeters';

  /**
   * The unit of angle-based measurement.
   */
  @Prop()
  public angleUnits: AngleUnitType = 'degrees';

  /**
   * The number of fraction digits to display.
   */
  @Prop()
  public fractionalDigits = 2;

  /**
   * An optional formatter that can be used to format the display of a distance.
   * The formatting function is passed a calculated real-world distance and is
   * expected to return a string.
   */
  @Prop()
  public distanceFormatter?: Formatter<number>;

  /**
   * An optional formatter that can be used to format the display of an angle.
   * The formatting function is passed a calculated angle in degrees and is
   * expected to return a string.
   */
  @Prop()
  public angleFormatter?: Formatter<number>;

  /**
   * An optional formatter that can be used to format the display of an area.
   * The formatting function is passed a calculated area and is
   * expected to return a string.
   */
  @Prop()
  public areaFormatter?: Formatter<number>;

  /**
   * A set of result types to display. If `undefined`, then all results will be
   * displayed.
   */
  @Prop()
  public resultTypes?: MeasurementResult['type'][];

  @State()
  private results: MeasurementResult[] = [];

  @State()
  private isApproximate = false;

  @State()
  private overlay?: MeasurementOverlay;

  @State()
  private distanceMeasurementUnits = new DistanceUnits(this.distanceUnits);

  @State()
  private angleMeasurementUnits = new AngleUnits(this.angleUnits);

  @State()
  private areaMeasurementUnits = new AreaUnits(this.distanceUnits);

  private onOutcomeChangedHandler?: Disposable;

  /**
   * @internal
   */
  protected connectedCallback(): void {
    this.onOutcomeChangedHandler = this.measurementModel.onOutcomeChanged(
      this.handleOutcomeChange
    );
    this.updateStateFromModel();
  }

  /**
   * @internal
   */
  protected disconnectedCallback(): void {
    this.onOutcomeChangedHandler?.dispose();
  }

  /**
   * @internal
   */
  @Watch('distanceUnits')
  protected handleDistanceUnitsChanged(): void {
    this.distanceMeasurementUnits = new DistanceUnits(this.distanceUnits);
    this.areaMeasurementUnits = new AreaUnits(this.distanceUnits);
  }

  /**
   * @internal
   */
  @Watch('angleUnits')
  protected handleAngleUnitsChanged(): void {
    this.angleMeasurementUnits = new AngleUnits(this.angleUnits);
  }

  /**
   * @internal
   */
  @Watch('measurementModel')
  protected handleMeasurementModelChanged(): void {
    this.onOutcomeChangedHandler?.dispose();
    this.onOutcomeChangedHandler = this.measurementModel.onOutcomeChanged(
      this.handleOutcomeChange
    );

    this.updateStateFromModel();
  }

  /**
   * @internal
   */
  @Watch('resultTypes')
  protected handleResultTypesChanged(): void {
    this.updateStateFromModel();
  }

  /**
   * @internal
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        {this.renderResult('planar-angle', (result) => (
          <PlanarAngleResultEntry
            result={result}
            overlays={this.measurementOverlays}
            formatter={this.makeAngleFormatter()}
            onShowOverlay={this.handleShowOverlay}
            onHideOverlay={this.handleHideOverlay}
          />
        ))}

        {this.renderResult('planar-distance', (result) => (
          <PlanarDistanceResultEntry
            result={result}
            overlays={this.measurementOverlays}
            formatter={this.makeDistanceFormatter()}
            onShowOverlay={this.handleShowOverlay}
            onHideOverlay={this.handleHideOverlay}
          />
        ))}

        {this.renderResult('surface-area', (result) => (
          <SurfaceAreaResultEntry
            result={result}
            overlays={this.measurementOverlays}
            formatter={this.makeAreaFormatter()}
            onShowOverlay={this.handleShowOverlay}
            onHideOverlay={this.handleHideOverlay}
          />
        ))}

        {this.renderResult('minimum-distance', (result) => (
          <MinimumDistanceResultEntry
            result={result}
            overlays={this.measurementOverlays}
            formatter={this.makeDistanceFormatter()}
            onShowOverlay={this.handleShowOverlay}
            onHideOverlay={this.handleHideOverlay}
          />
        ))}
      </Host>
    );
  }

  private handleShowOverlay = (
    overlay: MeasurementOverlay | undefined
  ): void => {
    this.overlay = overlay;
  };

  private handleHideOverlay = (): void => {
    this.overlay?.dispose();
  };

  private handleOutcomeChange = (): void => {
    this.updateStateFromModel();
  };

  private updateStateFromModel(): void {
    const isFilteredResultType = (result: MeasurementResult): boolean => {
      return this.resultTypes?.includes(result.type) ?? true;
    };

    const outcome = this.measurementModel.getOutcome();
    if (outcome != null) {
      this.results = outcome.results.filter(isFilteredResultType);
      this.isApproximate = outcome.isApproximate;
    } else {
      this.results = [];
      this.isApproximate = false;
    }
  }

  private renderResult<T extends MeasurementResult['type']>(
    type: T,
    render: (
      result: Extract<MeasurementResult, { type: T }>
    ) => h.JSX.IntrinsicElements | undefined
  ): h.JSX.IntrinsicElements | undefined {
    const result = this.getResultForType(type);
    return result != null ? render(result) : undefined;
  }

  private getResultForType<T extends MeasurementResult['type']>(
    type: T
  ): Extract<MeasurementResult, { type: T }> | undefined {
    return this.results.find((result) => result.type === type) as Extract<
      MeasurementResult,
      { type: T }
    >;
  }

  private makeDistanceFormatter(): Formatter<number> {
    return this.makeFormatter(
      (value) => this.distanceMeasurementUnits.convertWorldValueToReal(value),
      this.distanceMeasurementUnits.unit,
      this.distanceFormatter
    );
  }

  private makeAngleFormatter(): Formatter<number> {
    return this.makeFormatter(
      (value) => this.angleMeasurementUnits.convertTo(value),
      this.angleMeasurementUnits.unit,
      this.angleFormatter
    );
  }

  private makeAreaFormatter(): Formatter<number> {
    return this.makeFormatter(
      (value) => this.areaMeasurementUnits.convertWorldValueToReal(value),
      this.areaMeasurementUnits.unit,
      this.areaFormatter
    );
  }

  private makeFormatter(
    convert: (value: number) => number,
    units: Unit,
    customFormatter: Formatter<number> | undefined
  ): Formatter<number> {
    return (value) => {
      const v = convert(value);

      if (customFormatter != null) {
        return customFormatter(v);
      } else {
        return this.formatValue(v, units);
      }
    };
  }

  private formatValue(value: number, unit: Unit): string {
    const val = value.toFixed(this.fractionalDigits);
    return `${this.isApproximate ? '~' + val : val} ${unit.abbreviatedName}`;
  }
}
