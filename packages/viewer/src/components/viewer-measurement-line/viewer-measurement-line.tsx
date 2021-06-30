import { Component, h, Prop } from '@stencil/core';
import { Angle, Point } from '@vertexvis/geometry';

@Component({
  tag: 'vertex-viewer-measurement-line',
  styleUrl: 'viewer-measurement-line.css',
  shadow: true,
})
export class ViewerMeasurementLine {
  /**
   * A point that specifies the starting point of the line.
   */
  @Prop()
  public start: Point.Point = Point.create();

  /**
   * A point that specifies the ending point of the line.
   */
  @Prop()
  public end: Point.Point = Point.create();

  /**
   * A length of the line cap. The line cap is a line at each end of a line.
   */
  @Prop()
  public capLength = 0;

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    const angle = Angle.fromPoints(this.start, this.end);
    const startEndCap = getPerpendicularLine(this.start, angle, this.capLength);
    const endEndCap = getPerpendicularLine(this.end, angle, this.capLength);

    return (
      <svg class="line">
        <line
          x1={this.start.x}
          y1={this.start.y}
          x2={this.end.x}
          y2={this.end.y}
        />

        <line
          class="start-cap"
          x1={startEndCap.start.x}
          y1={startEndCap.start.y}
          x2={startEndCap.end.x}
          y2={startEndCap.end.y}
        />

        <line
          class="end-cap"
          x1={endEndCap.start.x}
          y1={endEndCap.start.y}
          x2={endEndCap.end.x}
          y2={endEndCap.end.y}
        />
      </svg>
    );
  }
}

function getPerpendicularLine(
  pt: Point.Point,
  angle: number,
  length: number
): { start: Point.Point; end: Point.Point } {
  const perpAngle = angle + Math.PI / 2;
  const start = Point.add(pt, Point.polar(length / 2, perpAngle));
  const end = Point.add(pt, Point.polar(length / 2, perpAngle + Math.PI));
  return { start, end };
}
