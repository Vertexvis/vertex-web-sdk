import { Component, h, Host, Prop, Watch } from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import { Formatter } from '../../lib/formatter';
import {
  MeasurementDetailsSummary,
  MeasurementModel,
  MeasurementResult,
  summarizeResults,
} from '../../lib/measurement';
import { MeasurementOutcome } from '../../lib/measurement/outcomes';
import {
  AngleUnits,
  AngleUnitType,
  AreaUnits,
  DistanceUnits,
  DistanceUnitType,
} from '../../lib/types';
import { MeasurementDetailsEntry } from './viewer-measurement-details-components';

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
   * The current `MeasurementOutcome` displayed.
   */
  @Prop({ mutable: true })
  public outcome: MeasurementOutcome | undefined;

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
    this.resultsChangeListener = this.measurementModel.onOutcomeChanged(
      this.handleOutcomeChange
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
    this.resultsChangeListener = this.measurementModel.onOutcomeChanged(
      this.handleOutcomeChange
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
          <MeasurementDetailsEntry label="Angle">
            {this.formatAngle(this.visibleSummary.angle)}
          </MeasurementDetailsEntry>
        )}
        {this.visibleSummary?.parallelDistance != null && (
          <MeasurementDetailsEntry label="Parallel Dist">
            {this.formatDistance(this.visibleSummary.parallelDistance)}
          </MeasurementDetailsEntry>
        )}
        {this.visibleSummary?.minDistance != null && (
          <MeasurementDetailsEntry label="Min Dist">
            {this.formatDistance(
              this.visibleSummary.minDistance.value,
              this.visibleSummary.minDistance.isApproximated
            )}
          </MeasurementDetailsEntry>
        )}
        {this.visibleSummary?.area != null && (
          <MeasurementDetailsEntry label="Area">
            {this.formatArea(this.visibleSummary.area)}
          </MeasurementDetailsEntry>
        )}
        {this.visibleSummary?.distanceVector?.x != null && (
          <MeasurementDetailsEntry label="X">
            {this.formatDistance(
              this.visibleSummary.distanceVector.x,
              this.visibleSummary.distanceVector.isApproximated
            )}
          </MeasurementDetailsEntry>
        )}
        {this.visibleSummary?.distanceVector?.y != null && (
          <MeasurementDetailsEntry label="Y">
            {this.formatDistance(
              this.visibleSummary.distanceVector.y,
              this.visibleSummary.distanceVector.isApproximated
            )}
          </MeasurementDetailsEntry>
        )}
        {this.visibleSummary?.distanceVector?.z != null && (
          <MeasurementDetailsEntry label="Z">
            {this.formatDistance(
              this.visibleSummary.distanceVector.z,
              this.visibleSummary.distanceVector.isApproximated
            )}
          </MeasurementDetailsEntry>
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

  private handleOutcomeChange = (
    outcome: MeasurementOutcome | undefined
  ): void => {
    this.outcome = outcome;
    this.createSummary();
  };

  private formatDistance = (
    distance: number,
    isApproximate = false
  ): string => {
    const realDistance = Math.abs(
      this.distanceMeasurementUnits.convertWorldValueToReal(distance)
    );

    if (this.distanceFormatter != null) {
      return this.distanceFormatter(realDistance);
    } else {
      const abbreviated = this.distanceMeasurementUnits.unit.abbreviatedName;
      const value = realDistance.toFixed(this.fractionalDigits);
      return realDistance == null
        ? '---'
        : `${isApproximate ? '~' + value : value} ${abbreviated}`;
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
    const baseSummary = summarizeResults(this.getMeasurementResults());
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

  private getMeasurementResults(): MeasurementResult[] {
    if (this.outcome == null) {
      return [];
    } else if (this.outcome.type === 'precise') {
      return this.outcome.results;
    } else {
      return [this.outcome.result];
    }
  }
}
