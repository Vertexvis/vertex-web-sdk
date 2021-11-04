import {
  Component,
  Host,
  h,
  Prop,
  EventEmitter,
  Event,
  State,
  Method,
  Element,
} from '@stencil/core';
import classNames from 'classnames';
import { Row } from '../scene-tree/lib/row';

@Component({
  tag: 'vertex-scene-tree-table-header',
  styleUrl: 'scene-tree-table-header.css',
  shadow: true,
})
export class SceneTreeTableHeader {
  @Prop()
  public columnWidths: Array<number | undefined> = [];

  @Prop()
  public columnLabels: Array<string | undefined> = [];

  public render(): h.JSX.IntrinsicElements {
    console.log(this.columnLabels, this.columnWidths);
    return (
      <Host>
        <div class="header">
          {this.columnLabels.map((l, i) => (
            <div
              class="header-label"
              style={{
                width: `${this.columnWidths[i] ?? 100}px`,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
