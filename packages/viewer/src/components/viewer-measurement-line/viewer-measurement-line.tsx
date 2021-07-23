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
   * The type of [SVG pointer
   * events](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pointer-events)
   * that the line should respond to.
   */
  @Prop()
  public pointerEvents = 'none';

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    const angle = Angle.fromPoints(this.start, this.end);
    const lineFillEndCaps = getEndCapPoints(
      this.start,
      this.end,
      angle,
      this.capLength
    );
    const lineStrokeEndCaps = getEndCapPoints(
      this.start,
      this.end,
      angle,
      this.capLength + 1
    );

    return (
      <svg>
        <g class="line-stroke" pointer-events={this.pointerEvents}>
          <line
            class="line"
            x1={this.start.x}
            y1={this.start.y}
            x2={this.end.x}
            y2={this.end.y}
          />

          <line
            class="start-cap"
            x1={lineStrokeEndCaps.startEndCap.start.x}
            y1={lineStrokeEndCaps.startEndCap.start.y}
            x2={lineStrokeEndCaps.startEndCap.end.x}
            y2={lineStrokeEndCaps.startEndCap.end.y}
          />

          <line
            class="end-cap"
            x1={lineStrokeEndCaps.endEndCap.start.x}
            y1={lineStrokeEndCaps.endEndCap.start.y}
            x2={lineStrokeEndCaps.endEndCap.end.x}
            y2={lineStrokeEndCaps.endEndCap.end.y}
          />
        </g>

        <g class="line-fill" pointer-events={this.pointerEvents}>
          <line
            class="line"
            x1={this.start.x}
            y1={this.start.y}
            x2={this.end.x}
            y2={this.end.y}
          />

          <line
            class="start-cap"
            x1={lineFillEndCaps.startEndCap.start.x}
            y1={lineFillEndCaps.startEndCap.start.y}
            x2={lineFillEndCaps.startEndCap.end.x}
            y2={lineFillEndCaps.startEndCap.end.y}
          />

          <line
            class="end-cap"
            x1={lineFillEndCaps.endEndCap.start.x}
            y1={lineFillEndCaps.endEndCap.start.y}
            x2={lineFillEndCaps.endEndCap.end.x}
            y2={lineFillEndCaps.endEndCap.end.y}
          />
        </g>
      </svg>
    );
  }
}

interface EndCapPoints {
  start: Point.Point;
  end: Point.Point;
}

interface LinePoints {
  startEndCap: EndCapPoints;
  endEndCap: EndCapPoints;
}

function getEndCapPoints(
  start: Point.Point,
  end: Point.Point,
  angle: number,
  length: number
): LinePoints {
  return {
    startEndCap: getPerpendicularLine(start, angle, length),
    endEndCap: getPerpendicularLine(end, angle, length),
  };
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
