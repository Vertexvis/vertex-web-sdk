/* eslint-disable @typescript-eslint/member-ordering */

import {
  Component,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
import { Euler, Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';
import { Objects } from '@vertexvis/utils';

import { HTMLDomRendererPositionableElement } from '../../interfaces';

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
export class ViewerDomElement implements HTMLDomRendererPositionableElement {
  /**
   * The local 3D position of where this element is located.
   */
  @Prop({ mutable: true, attribute: null })
  public position: Vector3.Vector3 = Vector3.origin();

  /**
   * @ignore
   */
  @Watch('position')
  protected handlePositionChange(): void {
    this.syncMatrix();
  }

  /**
   * The local 3D position of where this element is located, as a JSON string.
   * JSON representation can either be in the format of `[x, y, z]` or `{"x": 0,
   * "y": 0, "z": 0}`.
   */
  @Prop({ attribute: 'position' })
  public positionJson = '';

  /**
   * @ignore
   */
  @Watch('positionJson')
  protected handlePositionJsonChanged(): void {
    this.syncPosition();
  }

  /**
   * The local rotation of this element in Euler angles.
   */
  @Prop({ mutable: true, attribute: null })
  public rotation?: Euler.Euler;

  /**
   * @ignore
   */
  @Watch('rotation')
  protected handleRotationChanged(): void {
    this.syncQuaternionWithRotation();
  }

  /**
   * The local rotation of this element in Euler angles, as a JSON string. JSON
   * representation can either be `[x, y, z, order]` or `{"x": 0, "y": 0, "z":
   * 0, "order": "xyz"}`.
   */
  @Prop({ attribute: 'rotation' })
  public rotationJson?: string;

  /**
   * @ignore
   */
  @Watch('rotationJson')
  protected handleRotationJsonChanged(): void {
    this.syncRotation();
  }

  /**
   * The local rotation of this element.
   */
  @Prop({ mutable: true, attribute: null })
  public quaternion: Quaternion.Quaternion = Quaternion.create();

  /**
   * @ignore
   */
  @Watch('quaternion')
  protected handleQuaternionChange(): void {
    this.syncMatrix();
  }

  /**
   * The local quaternion rotation of this element, as a JSON string. JSON
   * representation can either be `[x, y, z, w]` or `{"x": 0, "y": 0, "z":
   * 0, "w": 1}`.
   */
  @Prop({ attribute: 'quaternion' })
  public quaternionJson = '';

  /**
   * @ignore
   */
  @Watch('quaternionJson')
  protected handleQuaternionJsonChanged(): void {
    this.syncQuaternion();
  }

  /**
   * The local scale of this element.
   */
  @Prop({ mutable: true, attribute: null })
  public scale: Vector3.Vector3 = Vector3.create(1, 1, 1);

  /**
   * @ignore
   */
  @Watch('scale')
  protected handleScaleChange(): void {
    this.syncMatrix();
  }

  /**
   * The local scale of this element, as a JSON string. JSON string
   * representation can either be in the format of `[x, y, z]` or `{"x": 0, "y":
   * 0, "z": 0}`.
   */
  @Prop({ attribute: 'scale' })
  public scaleJson = '';

  /**
   * @ignore
   */
  @Watch('scaleJson')
  protected handleScaleJsonChanged(): void {
    this.syncScale();
  }

  /**
   * @ignore
   */
  @Watch('matrix')
  protected handleMatrixChanged(
    newMatrix: Matrix4.Matrix4,
    oldMatrix: Matrix4.Matrix4
  ): void {
    if (!Objects.isEqual(newMatrix, oldMatrix)) {
      this.propertyChange.emit();
    }
  }

  /**
   * The local matrix of this element.
   */
  @Prop({ mutable: true, attribute: null })
  public matrix: Matrix4.Matrix4 = Matrix4.makeIdentity();

  /**
   * Disables occlusion testing for this element. Defaults to enabled. When
   * enabled, the elements position will be tested against the current depth
   * buffer. If the position is occluded, then the `occluded` attribute will be
   * set.
   */
  @Prop()
  public occlusionOff = false;

  /**
   * Indicates if the element is hidden by geometry. This property can be used
   * with a CSS selector to modify the appearance of the element when its
   * occluded.
   *
   * @example
   *
   * ```html
   * <style>
   *   vertex-viewer-dom-element[occluded] {
   *     opacity: 0;
   *   }
   * </style>
   * ```
   */
  @Prop({ reflect: true })
  public occluded = false;

  /**
   * Dispatched when the occlusion state is changed.
   */
  @Event({ bubbles: true })
  public occlusionStateChanged!: EventEmitter<boolean>;

  /**
   * Disables the billboarding behavior of the element. When billboarding is
   * enabled, the element will always be oriented towards the screen.
   */
  @Prop()
  public billboardOff = false;

  /**
   * Disables interaction events from children.
   */
  @Prop({ reflect: true })
  public interactionsOff = false;

  /**
   * An event that is emitted when any property on the dom group changes
   */
  @Event({ bubbles: true })
  public propertyChange!: EventEmitter<void>;

  /**
   * @ignore
   */
  protected connectedCallback(): void {
    this.syncProperties();
  }

  /**
   * @ignore
   */
  protected componentShouldUpdate(
    newValue: unknown,
    oldValue: unknown,
    prop: string
  ): boolean {
    return prop === 'occluded';
  }

  /**
   * @ignore
   */
  @Watch('occluded')
  protected handleOcclusionStateChanged(): void {
    this.occlusionStateChanged.emit(this.occluded);
  }

  private syncProperties(): void {
    this.syncPosition();
    this.syncRotation();
    this.syncQuaternion();
    this.syncScale();
    this.syncMatrix();
  }

  private syncPosition(): void {
    this.position =
      this.positionJson.length > 0
        ? this.parseJson('positionJson', this.positionJson, Vector3.fromJson)
        : this.position;
  }

  private syncRotation(): void {
    this.rotation =
      this.rotationJson != null && this.rotationJson.length > 0
        ? this.parseJson('rotationJson', this.rotationJson, Euler.fromJson)
        : this.rotation;
    this.syncQuaternionWithRotation();
  }

  private syncQuaternionWithRotation(): void {
    this.quaternion =
      this.rotation != null
        ? Quaternion.fromEuler(this.rotation)
        : this.quaternion;
  }

  private syncQuaternion(): void {
    this.quaternion =
      this.quaternionJson.length > 0
        ? this.parseJson(
            'quaternionJson',
            this.quaternionJson,
            Quaternion.fromJson
          )
        : this.quaternion;
  }

  private syncScale(): void {
    this.scale =
      this.scaleJson.length > 0
        ? this.parseJson('scaleJson', this.scaleJson, Vector3.fromJson)
        : this.scale;
  }

  private syncMatrix(): void {
    this.matrix = Matrix4.makeTRS(this.position, this.quaternion, this.scale);
  }

  private parseJson<T>(
    propName: string,
    value: string,
    parse: (str: string) => T
  ): T {
    try {
      return parse(value);
    } catch (e) {
      console.warn(`Could not parse \`${propName}\`. Invalid JSON.`);
      throw e;
    }
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
