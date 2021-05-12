import { Component, h, Prop, State, Watch } from '@stencil/core';
import { Matrix4 } from '@vertexvis/geometry';
import { makeLookAtViewMatrix } from '../../rendering/matrices';
import classNames from 'classnames';

@Component({
  tag: 'vertex-viewer-view-cube',
  styleUrl: 'viewer-view-cube.css',
  shadow: true,
})
export class ViewerViewCube {
  @Prop()
  public xPositiveLabel = 'Right';

  @Prop()
  public xNegativeLabel = 'Left';

  @Prop()
  public yPositiveLabel = 'Top';

  @Prop()
  public yNegativeLabel = 'Bottom';

  @Prop()
  public zPositiveLabel = 'Back';

  @Prop()
  public zNegativeLabel = 'Front';

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private viewMatrix?: Matrix4.Matrix4;

  protected componentDidLoad(): void {
    this.handleViewerChange(this.viewer, undefined);
  }

  protected render(): h.JSX.IntrinsicElements {
    /* eslint-disable prettier/prettier */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [
      m11, m12, m13, m14,
      m21, m22, m23, m24,
      m31, m32, m33, m34,
      m41, m42, m43, m44,
    ] = Matrix4.transpose(this.viewMatrix || Matrix4.identity());

    const matrix3d = [
      m11, m12, m13, m14,
      m21, m22, m23, m24,
      m31, m32, m33, m34,
      0, 0, 0, m44,
    ];
    /* eslint-enable prettier/prettier */
    /* eslint-enable @typescript-eslint/no-unused-vars */

    const style = {
      transform: [
        // Scales the cube so a face is the same size as this element. We can't
        // apply percentage sizes using `translateZ`, so we rotate the cube and
        // use translateX which support percentage values.
        'rotateY(-90deg)',
        'translateX(calc(100% / -2))',
        'rotateY(90deg)',

        // Flips the coordinate space because we're working in CSS.
        'scale3d(-1, 1, -1)',

        // Applies the view matrix using a column major matrix.
        `matrix3d(${matrix3d.join(', ')})`,
      ].join(' '),
    };

    return (
      <div class={classNames('scene', { ready: this.viewMatrix != null })}>
        <div class="cube" style={style}>
          <div class="cube-face cube-face-front">{this.zNegativeLabel}</div>
          <div class="cube-face cube-face-back">{this.zPositiveLabel}</div>
          <div class="cube-face cube-face-left">{this.xNegativeLabel}</div>
          <div class="cube-face cube-face-right">{this.xPositiveLabel}</div>
          <div class="cube-face cube-face-top">{this.yPositiveLabel}</div>
          <div class="cube-face cube-face-bottom">{this.yNegativeLabel}</div>
        </div>
      </div>
    );
  }

  @Watch('viewer')
  protected handleViewerChange(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
  }

  private handleViewerFrameDrawn = async (): Promise<void> => {
    const scene = await this.viewer?.scene();
    const camera = scene?.camera();

    if (camera != null) {
      this.viewMatrix = makeLookAtViewMatrix(camera);
    } else {
      this.viewMatrix = Matrix4.identity();
    }
  };
}
