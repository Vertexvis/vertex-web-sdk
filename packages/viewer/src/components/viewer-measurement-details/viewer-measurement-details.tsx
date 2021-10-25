/* eslint-disable no-restricted-imports */
import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
/* eslint-enable no-restricted-imports */
import { Angle } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import {
  MeasurementModel,
  MeasurementResult,
} from '../../lib/measurement/model';
import { MeasurementUnits, UnitType } from '../../lib/types';
import { formatResults } from './utils';

export type ViewerMeasurementDetailsDistanceFormatter = (
  distance: number
) => string;

export type ViewerMeasurementDetailsAngleFormatter = (angle: number) => string;

export type ViewerMeasurementDetailsAngleUnit = 'degrees' | 'radians';

export interface ViewerMeasurementDetailsSummary {
  parallelDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  area?: number;
  angle?: number;
  x?: number;
  y?: number;
  z?: number;
}

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
   * The unit of distance-based measurement.
   */
  @Prop()
  public distanceUnits: UnitType = 'millimeters';

  /**
   * The unit of angle-based measurement.
   */
  @Prop()
  public angleUnits: ViewerMeasurementDetailsAngleUnit = 'degrees';

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
  public distanceFormatter?: ViewerMeasurementDetailsDistanceFormatter;

  /**
   * An optional formatter that can be used to format the display of an angle.
   * The formatting function is passed a calculated angle in degrees and is
   * expected to return a string.
   */
  @Prop()
  public angleFormatter?: ViewerMeasurementDetailsAngleFormatter;

  /**
   * An optional set of details to hide. This can be used to display
   * reduced sets of details for more a more focused representation.
   * Can be provided as an array of keys from the `ViewerMeasurementDetailsSummary`
   * type, or as a JSON array with the format '["angle", "minDistance"]'.
   */
  @Prop({ mutable: true })
  public hiddenDetails?: Array<keyof ViewerMeasurementDetailsSummary>;

  /**
   * An optional set of details to hide. This can be used to display
   * reduced sets of details for more a more focused representation.
   * Can be provided as an array of keys from the `ViewerMeasurementDetailsSummary`
   * type, or as a JSON array with the format '["angle", "minDistance"]'.
   */
  @Prop({ attribute: 'hidden-details' })
  public hiddenDetailsJson?: string;

  /**
   * The current `MeasurementResult` displayed.
   *
   * @readonly
   */
  @Prop({
    mutable: true,
  })
  public results: MeasurementResult[] = [];

  /**
   * A summary representing all available measurements based on
   * the current `MeasurementResult` set.
   *
   * @readonly
   */
  @Prop({
    mutable: true,
  })
  public summary?: ViewerMeasurementDetailsSummary;

  /**
   * The visible measurements based on the current `summary`
   * and `hiddenDetails`.
   *
   * @readonly
   */
  @Prop({
    mutable: true,
  })
  public visibleSummary?: ViewerMeasurementDetailsSummary;

  private distanceMeasurementUnits = new MeasurementUnits(this.distanceUnits);
  private resultsChangeListener?: Disposable;

  public connectedCallback(): void {
    this.resultsChangeListener = this.measurementModel.onResultsChanged(
      this.handleResultsChange
    );
  }

  public componentWillLoad(): void {
    this.parseHiddenDetails();
  }

  public componentWillUpdate(): void {
    this.parseHiddenDetails();
  }

  public disconnectedCallback(): void {
    this.resultsChangeListener?.dispose();
  }

  @Watch('distanceUnits')
  protected handleDistanceUnitsChanged(): void {
    this.distanceMeasurementUnits = new MeasurementUnits(this.distanceUnits);
  }

  @Watch('measurementModel')
  protected handleMeasurementModelChanged(): void {
    this.resultsChangeListener?.dispose();
    this.resultsChangeListener = this.measurementModel.onResultsChanged(
      this.handleResultsChange
    );
  }

  @Watch('hiddenDetails')
  protected handleHiddenDetailsChanged(): void {
    this.createSummary();
  }

  public render(): h.JSX.IntrinsicElements {
    return this.visibleSummary != null ? (
      <Host>
        {this.visibleSummary?.angle != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label">Angle:</div>
            {this.formatAngle(this.visibleSummary.angle)}
          </div>
        )}
        {this.visibleSummary?.parallelDistance != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label">Parallel Dist:</div>
            {this.formatDistance(this.visibleSummary.parallelDistance)}
          </div>
        )}
        {this.visibleSummary?.minDistance != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label">Min Dist:</div>
            {this.formatDistance(this.visibleSummary.minDistance)}
          </div>
        )}
        {this.visibleSummary?.x != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label x-label">X:</div>
            {this.formatDistance(this.visibleSummary.x)}
          </div>
        )}
        {this.visibleSummary?.y != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label y-label">Y:</div>
            {this.formatDistance(this.visibleSummary.y)}
          </div>
        )}
        {this.visibleSummary?.z != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label z-label">Z:</div>
            {this.formatDistance(this.visibleSummary.z)}
          </div>
        )}
      </Host>
    ) : (
      <Host />
    );
  }

  private parseHiddenDetails(): void {
    if (this.hiddenDetailsJson != null) {
      this.hiddenDetails = JSON.parse(this.hiddenDetailsJson);
    }
  }

  private handleResultsChange = (results: MeasurementResult[]): void => {
    this.results = results;
    this.createSummary();
  };

  private formatDistance = (distance: number): string => {
    const realDistance =
      this.distanceMeasurementUnits.translateWorldValueToReal(distance);

    if (this.distanceFormatter != null) {
      return this.distanceFormatter(realDistance);
    } else {
      const abbreviated = this.distanceMeasurementUnits.unit.abbreviatedName;
      return realDistance == null
        ? '---'
        : `${realDistance.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  };

  private formatAngle = (angle: number): string => {
    if (this.angleFormatter != null) {
      return this.angleFormatter(angle);
    } else if (this.angleUnits === 'degrees') {
      return `${angle.toFixed(this.fractionalDigits)}º`;
    } else {
      return `${Angle.toRadians(angle).toFixed(this.fractionalDigits)} rad`;
    }
  };

  private createSummary = (): void => {
    const baseSummary = formatResults(this.results);
    const hidden = this.hiddenDetails ?? [];

    this.summary = baseSummary;
    this.visibleSummary = (
      Object.keys(baseSummary) as Array<keyof ViewerMeasurementDetailsSummary>
    )
      .filter((k) => !hidden.includes(k))
      .reduce(
        (reducedSummary, key) => ({
          ...reducedSummary,
          [key]: baseSummary[key],
        }),
        {}
      );
  };
}
