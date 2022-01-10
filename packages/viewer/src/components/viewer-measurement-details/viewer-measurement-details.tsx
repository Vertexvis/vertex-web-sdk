import { Component, h, Host, Prop, Watch } from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import { Formatter } from '../../lib/formatter';
import {
  MeasurementDetailsSummary,
  MeasurementModel,
  MeasurementResult,
  summarizeResults,
} from '../../lib/measurement';
import {
  AngleUnits,
  AngleUnitType,
  AreaUnits,
  DistanceUnits,
  DistanceUnitType,
} from '../../lib/types';

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
   * An optional set of details to hide. This can be used to display
   * reduced sets of details for more a more focused representation.
   * Can be provided as an array of keys from the `MeasurementDetailsSummary`
   * type, or as a JSON array with the format '["angle", "minDistance"]'.
   */
  @Prop({ mutable: true })
  public hiddenDetails?: Array<keyof MeasurementDetailsSummary>;

  /**
   * An optional set of details to hide. This can be used to display
   * reduced sets of details for more a more focused representation.
   * Can be provided as an array of keys from the `MeasurementDetailsSummary`
   * type, or as a JSON array with the format '["angle", "minDistance"]'.
   */
  @Prop({ attribute: 'hidden-details' })
  public hiddenDetailsJson?: string;

  /**
   * The current `MeasurementResult` displayed.
   *
   * @readonly
   */
  @Prop({ mutable: true })
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
  public summary?: MeasurementDetailsSummary;

  /**
   * The visible measurements based on the current `summary`
   * and `hiddenDetails`.
   *
   * @readonly
   */
  @Prop({
    mutable: true,
  })
  public visibleSummary?: MeasurementDetailsSummary;

  private distanceMeasurementUnits = new DistanceUnits(this.distanceUnits);
  private angleMeasurementUnits = new AngleUnits(this.angleUnits);
  private areaMeasurementUnits = new AreaUnits(this.distanceUnits);
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
    this.distanceMeasurementUnits = new DistanceUnits(this.distanceUnits);
    this.areaMeasurementUnits = new AreaUnits(this.distanceUnits);
  }

  @Watch('angleUnits')
  protected handleAngleUnitsChanged(): void {
    this.angleMeasurementUnits = new AngleUnits(this.angleUnits);
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
        {this.visibleSummary?.area != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label">Area:</div>
            <div innerHTML={this.formatArea(this.visibleSummary.area)} />
          </div>
        )}
        {this.visibleSummary?.distanceVector?.x != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label x-label">X:</div>
            {this.formatDistance(this.visibleSummary.distanceVector?.x)}
          </div>
        )}
        {this.visibleSummary?.distanceVector?.y != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label y-label">Y:</div>
            {this.formatDistance(this.visibleSummary.distanceVector?.y)}
          </div>
        )}
        {this.visibleSummary?.distanceVector?.z != null && (
          <div class="measurement-details-entry">
            <div class="measurement-details-entry-label z-label">Z:</div>
            {this.formatDistance(this.visibleSummary.distanceVector?.z)}
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
    const realDistance = Math.abs(
      this.distanceMeasurementUnits.convertWorldValueToReal(distance)
    );

    if (this.distanceFormatter != null) {
      return this.distanceFormatter(realDistance);
    } else {
      const abbreviated = this.distanceMeasurementUnits.unit.abbreviatedName;
      return realDistance == null
        ? '---'
        : `${realDistance.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  };

  private formatAngle = (angleInRadians: number): string => {
    if (this.angleFormatter != null) {
      return this.angleFormatter(angleInRadians);
    } else {
      const value = this.angleMeasurementUnits
        .convertTo(angleInRadians)
        .toFixed(this.fractionalDigits);
      return `${value} ${this.angleMeasurementUnits.unit.abbreviatedName}`;
    }
  };

  private formatArea = (area: number): string => {
    const realArea = this.areaMeasurementUnits.convertWorldValueToReal(area);

    if (this.areaFormatter != null) {
      return this.areaFormatter(area);
    } else {
      const abbreviated = this.areaMeasurementUnits.unit.abbreviatedName;
      return realArea == null
        ? '---'
        : `${realArea.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  };

  private createSummary = (): void => {
    const baseSummary = summarizeResults(this.results);
    const hidden = this.hiddenDetails ?? [];

    this.summary = baseSummary;
    this.visibleSummary = (
      Object.keys(baseSummary) as Array<keyof MeasurementDetailsSummary>
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
