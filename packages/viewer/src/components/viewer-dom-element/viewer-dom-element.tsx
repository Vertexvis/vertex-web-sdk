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

/**
 * The `ViewerDomElement` is responsible for managing a
 * `<vertex-viewer-dom-element>` element. These elements are intended to be
 * added as children to a `<vertex-viewer-dom-renderer>` and represent an
 * individual DOM element within a local 3D scene.
 */
@Component({
  tag: 'vertex-viewer-dom-element',
  styleUrl: 'viewer-dom-element.css',
  shadow: true,
})
export class ViewerDomElement {
  /**
   * The 3D position where this element is located.
   */
  @Prop()
  public position: Vector3.Vector3 = Vector3.origin();

  /**
   * The rotation of this this element, represented as a Quaternion.
   */
  @Prop()
  public quaternion: Quaternion.Quaternion = Quaternion.create();

  /**
   * The scale of this element.
   */
  @Prop()
  public scale: Vector3.Vector3 = Vector3.create(1, 1, 1);

  /**
   * The direction which this object considers up.
   */
  @Prop()
  public up: Vector3.Vector3 = Vector3.up();

  /**
   * Disables the billboarding behavior of the element. When billboarding is
   * enabled, the element will always be oriented towards the screen.
   */
  @Prop()
  public billboardOff = false;

  /**
   * An event that's emitted when a property of this component changes.
   */
  @Event()
  public propertyChange!: EventEmitter<void>;

  /**
   * @ignore
   */
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

  /**
   * @ignore
   */
  @Watch('position')
  protected handlePositionChange(): void {
    this.dispatchPropertyChange();
  }

  /**
   * @ignore
   */
  @Watch('quaternion')
  protected handleQuaternionChange(): void {
    this.dispatchPropertyChange();
  }

  /**
   * @ignore
   */
  @Watch('scale')
  protected handleScaleChange(): void {
    this.dispatchPropertyChange();
  }

  /**
   * @ignore
   */
  @Watch('up')
  protected handleUpChange(): void {
    this.dispatchPropertyChange();
  }

  private dispatchPropertyChange(): void {
    this.propertyChange.emit();
  }
}
