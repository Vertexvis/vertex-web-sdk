/* eslint-disable no-restricted-imports */
import { Component, h, Host, Prop, Watch } from '@stencil/core';
/* eslint-enable no-restricted-imports */
import { Angle } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import {
  MeasurementModel,
  MeasurementResult,
} from '../../lib/measurement/model';
import { MeasurementUnits, UnitType } from '../../lib/types';
import {
  getMeasurementDetailsSummary,
  MeasurementDetailsSummary,
} from './utils';

export type ViewerMeasurementDetailsDistanceFormatter = (
  distance: number
) => string;

export type ViewerMeasurementDetailsAngleFormatter = (angle: number) => string;

export type ViewerMeasurementDetailsAngleUnit = 'degrees' | 'radians';

@Component({
  tag: 'vertex-viewer-measurement-details',
  styleUrl: 'viewer-measurement-details.css',
  shadow: true,
})
export class ViewerMeasurementDetails {
  /**
   * The `MeasurementModel` that this popover should reflect.
   * If not specified, a new `MeasurementModel` will be created,
   * which can then be used to update the display of this popover.
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
   * @readonly
   *
   * The current `MeasurementResult` displayed.
   */
  @Prop({
    mutable: true,
  })
  public results: MeasurementResult[] = [];

  /**
   * @readonly
   *
   * A summary representing all available measurements based on
   * the current `MeasurementResult` set.
   */
  @Prop({
    mutable: true,
  })
  public summary?: MeasurementDetailsSummary;

  private distanceMeasurementUnits = new MeasurementUnits(this.distanceUnits);
  private resultsChangeListener?: Disposable;

  public async connectedCallback(): Promise<void> {
    this.resultsChangeListener = this.measurementModel.onResultsChanged(
      this.handleResultsChange
    );
  }

  public disconnectedCallback(): void {
    this.resultsChangeListener?.dispose();
  }

  @Watch('distanceUnits')
  protected handleDistanceUnitsChanged(): void {
    this.distanceMeasurementUnits = new MeasurementUnits(this.distanceUnits);
  }

  public render(): h.JSX.IntrinsicElements {
    return this.summary != null ? (
      <div class="measurement-details">
        {this.summary?.angle != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label">Angle:</div>
            {this.formatAngle(this.summary.angle)}
          </div>
        )}
        {this.summary?.parallelDistance != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label">Parallel Dist:</div>
            {this.formatDistance(this.summary.parallelDistance)}
          </div>
        )}
        {this.summary?.minDistance != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label">Min Dist:</div>
            {this.formatDistance(this.summary.minDistance)}
          </div>
        )}
        {this.summary?.x != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label x-label">X:</div>
            {this.formatDistance(this.summary.x)}
          </div>
        )}
        {this.summary?.y != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label y-label">Y:</div>
            {this.formatDistance(this.summary.y)}
          </div>
        )}
        {this.summary?.z != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label z-label">Z:</div>
            {this.formatDistance(this.summary.z)}
          </div>
        )}
      </div>
    ) : (
      <Host />
    );
  }

  private handleResultsChange = (results: MeasurementResult[]): void => {
    this.results = results;
    this.summary = getMeasurementDetailsSummary(results);
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
}
