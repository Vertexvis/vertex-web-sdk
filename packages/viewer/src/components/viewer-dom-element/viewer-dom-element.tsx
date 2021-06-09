import {
  Component,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
import { Euler, Quaternion, Vector3 } from '@vertexvis/geometry';

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
   * The 3D position where this element is located. Can either be an instance of
   * a `Vector3` or a JSON string representation in the format of `[x, y, z]` or
   * `{"x": 0, "y": 0, "z": 0}`.
   */
  @Prop()
  public position: Vector3.Vector3 | string = Vector3.origin();

  /**
   * The rotation of this this element, represented as a `Quaternion`, `Euler`
   * or a JSON string representation in one of the following formats:
   *
   * * `[x, y, z, w]`
   * * `{"x": 0, "y": 0, "z": 0, "w": 0}`
   * * `[x, y, z, order]`
   * * `{"x": 0, "y": 0, "z": 0, "order": "xyz"}`
   */
  @Prop()
  public rotation:
    | Quaternion.Quaternion
    | Euler.Euler
    | string = Quaternion.create();

  /**
   * The scale of this element. Can either be an instance of a `Vector3` or a
   * JSON string representation in the format of `[x, y, z]` or `{"x": 0, "y":
   * 0, "z": 0}`.
   */
  @Prop()
  public scale: Vector3.Vector3 | string = Vector3.create(1, 1, 1);

  /**
   * Indicates if the element is hidden by geometry.
   */
  @Prop({ reflect: true })
  public occluded = false;

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
  @Watch('rotation')
  protected handleRotationChange(): void {
    this.dispatchPropertyChange();
  }

  /**
   * @ignore
   */
  @Watch('scale')
  protected handleScaleChange(): void {
    this.dispatchPropertyChange();
  }

  private dispatchPropertyChange(): void {
    this.propertyChange.emit();
  }
}
