import {
  Component,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
import { Quaternion, Vector3 } from '@vertexvis/geometry';

@Component({
  tag: 'vertex-viewer-dom-element',
  styleUrl: 'viewer-dom-element.css',
  shadow: true,
})
export class ViewerDomElement {
  @Prop()
  public position: Vector3.Vector3 = Vector3.origin();

  @Prop()
  public quaternion: Quaternion.Quaternion = Quaternion.create();

  @Prop()
  public scale: Vector3.Vector3 = Vector3.create(1, 1, 1);

  @Prop()
  public up: Vector3.Vector3 = Vector3.up();

  @Prop()
  public billboard = false;

  @Event()
  public propertyChange!: EventEmitter<void>;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

  @Watch('position')
  protected handlePositionChange(): void {
    this.dispatchPropertyChange();
  }

  @Watch('quaternion')
  protected handleQuaternionChange(): void {
    this.dispatchPropertyChange();
  }

  @Watch('scale')
  protected handleScaleChange(): void {
    this.dispatchPropertyChange();
  }

  @Watch('up')
  protected handleUpChange(): void {
    this.dispatchPropertyChange();
  }

  private dispatchPropertyChange(): void {
    this.propertyChange.emit();
  }
}
