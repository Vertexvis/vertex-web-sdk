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
  tag: 'vertex-scene-tree-table-column',
  styleUrl: 'scene-tree-table-column.css',
  shadow: true,
})
export class SceneTreeTableColumn {
  @Prop()
  public initialWidth?: number;

  @Prop()
  public label?: string;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="column">
          <slot />
        </div>
      </Host>
    );
  }
}
