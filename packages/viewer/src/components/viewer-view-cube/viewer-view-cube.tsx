import { Component, h, Prop, State, Watch } from '@stencil/core';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { makeLookAtViewMatrix } from '../../rendering/matrices';
import classNames from 'classnames';
import { FrameCamera } from '../../types';
import {
  ViewerViewCubeBackLeftEdge,
  ViewerViewCubeBackRightEdge,
  ViewerViewCubeBottomBackEdge,
  ViewerViewCubeBottomBackLeftEdge,
  ViewerViewCubeBottomBackRightEdge,
  ViewerViewCubeBottomFrontEdge,
  ViewerViewCubeBottomFrontLeftEdge,
  ViewerViewCubeBottomFrontRightEdge,
  ViewerViewCubeBottomLeftEdge,
  ViewerViewCubeBottomRightEdge,
  ViewerViewCubeFrontLeftEdge,
  ViewerViewCubeFrontRightEdge,
  ViewerViewCubeTopBackEdge,
  ViewerViewCubeTopBackLeftEdge,
  ViewerViewCubeTopBackRightEdge,
  ViewerViewCubeTopFrontEdge,
  ViewerViewCubeTopFrontLeftEdge,
  ViewerViewCubeTopFrontRightEdge,
  ViewerViewCubeTopLeftEdge,
  ViewerViewCubeTopRightEdge,
} from './viewer-view-cube-corner';

type StandardView =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-front-left'
  | 'top-front-right'
  | 'bottom-front-left'
  | 'bottom-front-right'
  | 'top-back-left'
  | 'top-back-right'
  | 'bottom-back-left'
  | 'bottom-back-right'
  | 'top-front'
  | 'bottom-front'
  | 'front-left'
  | 'front-right'
  | 'top-back'
  | 'bottom-back'
  | 'back-left'
  | 'back-right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

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
  public animationDuration = 500;

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private viewMatrix?: Matrix4.Matrix4;

  @State()
  private hoveredStandardView?: StandardView;

  private standardViews: Record<StandardView, FrameCamera.FrameCamera> = {
    front: {
      position: Vector3.back(),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    back: {
      position: Vector3.forward(),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    left: {
      position: Vector3.left(),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    right: {
      position: Vector3.right(),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    top: {
      position: Vector3.up(),
      lookAt: Vector3.origin(),
      up: Vector3.forward(),
    },
    bottom: {
      position: Vector3.down(),
      lookAt: Vector3.origin(),
      up: Vector3.back(),
    },
    'top-front-left': {
      position: Vector3.add(Vector3.back(), Vector3.up(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'top-front-right': {
      position: Vector3.add(Vector3.back(), Vector3.up(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-front-left': {
      position: Vector3.add(Vector3.back(), Vector3.down(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-front-right': {
      position: Vector3.add(Vector3.back(), Vector3.down(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'top-back-left': {
      position: Vector3.add(Vector3.forward(), Vector3.up(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'top-back-right': {
      position: Vector3.add(Vector3.forward(), Vector3.up(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-back-left': {
      position: Vector3.add(Vector3.forward(), Vector3.down(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-back-right': {
      position: Vector3.add(Vector3.forward(), Vector3.down(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'top-front': {
      position: Vector3.add(Vector3.back(), Vector3.up()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-front': {
      position: Vector3.add(Vector3.back(), Vector3.down()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'front-left': {
      position: Vector3.add(Vector3.back(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'front-right': {
      position: Vector3.add(Vector3.back(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'top-back': {
      position: Vector3.add(Vector3.forward(), Vector3.up()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-back': {
      position: Vector3.add(Vector3.forward(), Vector3.down()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'back-left': {
      position: Vector3.add(Vector3.forward(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'back-right': {
      position: Vector3.add(Vector3.forward(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'top-left': {
      position: Vector3.add(Vector3.up(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'top-right': {
      position: Vector3.add(Vector3.up(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-left': {
      position: Vector3.add(Vector3.down(), Vector3.left()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    'bottom-right': {
      position: Vector3.add(Vector3.down(), Vector3.right()),
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
  };

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
          <div
            class="cube-side cube-face cube-face-front"
            onMouseDown={this.handleStandardView('front')}
          >
            {this.zNegativeLabel}
          </div>
          <div
            class="cube-side cube-face cube-face-back"
            onMouseDown={this.handleStandardView('back')}
          >
            {this.zPositiveLabel}
          </div>
          <div
            class="cube-side cube-face cube-face-left"
            onMouseDown={this.handleStandardView('left')}
          >
            {this.xNegativeLabel}
          </div>
          <div
            class="cube-side cube-face cube-face-right"
            onMouseDown={this.handleStandardView('right')}
          >
            {this.xPositiveLabel}
          </div>
          <div
            class="cube-side cube-face cube-face-top"
            onMouseDown={this.handleStandardView('top')}
          >
            {this.yPositiveLabel}
          </div>
          <div
            class="cube-side cube-face cube-face-bottom"
            onMouseDown={this.handleStandardView('bottom')}
          >
            {this.yNegativeLabel}
          </div>

          <ViewerViewCubeTopFrontLeftEdge
            hovered={this.hoveredStandardView === 'top-front-left'}
            onMouseDown={this.handleStandardView('top-front-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'top-front-left'
                : undefined)
            }
          />
          <ViewerViewCubeTopFrontRightEdge
            hovered={this.hoveredStandardView === 'top-front-right'}
            onMouseDown={this.handleStandardView('top-front-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'top-front-right'
                : undefined)
            }
          />
          <ViewerViewCubeBottomFrontLeftEdge
            hovered={this.hoveredStandardView === 'bottom-front-left'}
            onMouseDown={this.handleStandardView('bottom-front-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-front-left'
                : undefined)
            }
          />
          <ViewerViewCubeBottomFrontRightEdge
            hovered={this.hoveredStandardView === 'bottom-front-right'}
            onMouseDown={this.handleStandardView('bottom-front-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-front-right'
                : undefined)
            }
          />

          <ViewerViewCubeTopBackLeftEdge
            hovered={this.hoveredStandardView === 'top-back-left'}
            onMouseDown={this.handleStandardView('top-back-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-back-left' : undefined)
            }
          />
          <ViewerViewCubeTopBackRightEdge
            hovered={this.hoveredStandardView === 'top-back-right'}
            onMouseDown={this.handleStandardView('top-back-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'top-back-right'
                : undefined)
            }
          />
          <ViewerViewCubeBottomBackLeftEdge
            hovered={this.hoveredStandardView === 'bottom-back-left'}
            onMouseDown={this.handleStandardView('bottom-back-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-back-left'
                : undefined)
            }
          />
          <ViewerViewCubeBottomBackRightEdge
            hovered={this.hoveredStandardView === 'bottom-back-right'}
            onMouseDown={this.handleStandardView('bottom-back-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-back-right'
                : undefined)
            }
          />

          <ViewerViewCubeTopFrontEdge
            hovered={this.hoveredStandardView === 'top-front'}
            onMouseDown={this.handleStandardView('top-front')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-front' : undefined)
            }
          />
          <ViewerViewCubeBottomFrontEdge
            hovered={this.hoveredStandardView === 'bottom-front'}
            onMouseDown={this.handleStandardView('bottom-front')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'bottom-front' : undefined)
            }
          />
          <ViewerViewCubeFrontLeftEdge
            hovered={this.hoveredStandardView === 'front-left'}
            onMouseDown={this.handleStandardView('front-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'front-left' : undefined)
            }
          />
          <ViewerViewCubeFrontRightEdge
            hovered={this.hoveredStandardView === 'front-right'}
            onMouseDown={this.handleStandardView('front-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'front-right' : undefined)
            }
          />

          <ViewerViewCubeTopBackEdge
            hovered={this.hoveredStandardView === 'top-back'}
            onMouseDown={this.handleStandardView('top-back')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-back' : undefined)
            }
          />
          <ViewerViewCubeBottomBackEdge
            hovered={this.hoveredStandardView === 'bottom-back'}
            onMouseDown={this.handleStandardView('bottom-back')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'bottom-back' : undefined)
            }
          />
          <ViewerViewCubeBackLeftEdge
            hovered={this.hoveredStandardView === 'back-left'}
            onMouseDown={this.handleStandardView('back-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'back-left' : undefined)
            }
          />
          <ViewerViewCubeBackRightEdge
            hovered={this.hoveredStandardView === 'back-right'}
            onMouseDown={this.handleStandardView('back-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'back-right' : undefined)
            }
          />

          <ViewerViewCubeTopLeftEdge
            hovered={this.hoveredStandardView === 'top-left'}
            onMouseDown={this.handleStandardView('top-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-left' : undefined)
            }
          />
          <ViewerViewCubeTopRightEdge
            hovered={this.hoveredStandardView === 'top-right'}
            onMouseDown={this.handleStandardView('top-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-right' : undefined)
            }
          />
          <ViewerViewCubeBottomLeftEdge
            hovered={this.hoveredStandardView === 'bottom-left'}
            onMouseDown={this.handleStandardView('bottom-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'bottom-left' : undefined)
            }
          />
          <ViewerViewCubeBottomRightEdge
            hovered={this.hoveredStandardView === 'bottom-right'}
            onMouseDown={this.handleStandardView('bottom-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'bottom-right' : undefined)
            }
          />
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

  private handleStandardView(view: StandardView): () => Promise<void> {
    return async () => {
      console.log('view', view);
      if (this.viewer != null) {
        const scene = await this.viewer.scene();
        const animation =
          this.animationDuration > 0
            ? { animation: { milliseconds: this.animationDuration } }
            : {};
        scene
          .camera()
          .update(this.standardViews[view])
          .viewAll()
          .render(animation);
      }
    };
  }
}
