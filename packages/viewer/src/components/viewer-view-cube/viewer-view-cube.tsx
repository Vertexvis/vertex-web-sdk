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
} from './viewer-view-cube-edges';
import { ViewerViewCubeSide } from './viewer-view-cube-sides';

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
  /**
   * The label for the side of the cube on the positive x-axis.
   */
  @Prop()
  public xPositiveLabel = 'Right';

  /**
   * The label for the side of the cube on the negative x-axis.
   */
  @Prop()
  public xNegativeLabel = 'Left';

  /**
   * The label for the side of the cube on the positive y-axis.
   */
  @Prop()
  public yPositiveLabel = 'Top';

  /**
   * The label for the side of the cube on the negative y-axis.
   */
  @Prop()
  public yNegativeLabel = 'Bottom';

  /**
   * The label for the side of the cube on the positive z-axis.
   */
  @Prop()
  public zPositiveLabel = 'Back';

  /**
   * The label for the side of the cube on the negative z-axis.
   */
  @Prop()
  public zNegativeLabel = 'Front';

  /**
   * The duration of the animation, in milliseconds, when a user performs a
   * standard view interaction. Set to 0 to disable animations.
   */
  @Prop()
  public animationDuration = 500;

  /**
   * Disables standard view interactions.
   */
  @Prop()
  public standardViewsDisabled = false;

  /**
   * An instance of the viewer to bind to.
   */
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
    ] = Matrix4.transpose(this.viewMatrix || Matrix4.makeIdentity());

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
          <ViewerViewCubeSide
            side="front"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('front')}
          >
            {this.zNegativeLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="back"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('back')}
          >
            {this.zPositiveLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="left"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('left')}
          >
            {this.xNegativeLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="right"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('right')}
          >
            {this.xPositiveLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="top"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top')}
          >
            {this.yPositiveLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="bottom"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom')}
          >
            {this.yNegativeLabel}
          </ViewerViewCubeSide>

          <ViewerViewCubeTopFrontLeftEdge
            id="top-front-left"
            hovered={this.hoveredStandardView === 'top-front-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-front-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'top-front-left'
                : undefined)
            }
          />
          <ViewerViewCubeTopFrontRightEdge
            id="top-front-right"
            hovered={this.hoveredStandardView === 'top-front-right'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-front-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'top-front-right'
                : undefined)
            }
          />
          <ViewerViewCubeBottomFrontLeftEdge
            id="bottom-front-left"
            hovered={this.hoveredStandardView === 'bottom-front-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom-front-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-front-left'
                : undefined)
            }
          />
          <ViewerViewCubeBottomFrontRightEdge
            id="bottom-front-right"
            hovered={this.hoveredStandardView === 'bottom-front-right'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom-front-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-front-right'
                : undefined)
            }
          />

          <ViewerViewCubeTopBackLeftEdge
            id="top-back-left"
            hovered={this.hoveredStandardView === 'top-back-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-back-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-back-left' : undefined)
            }
          />
          <ViewerViewCubeTopBackRightEdge
            id="top-back-right"
            hovered={this.hoveredStandardView === 'top-back-right'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-back-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'top-back-right'
                : undefined)
            }
          />
          <ViewerViewCubeBottomBackLeftEdge
            id="bottom-back-left"
            hovered={this.hoveredStandardView === 'bottom-back-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom-back-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-back-left'
                : undefined)
            }
          />
          <ViewerViewCubeBottomBackRightEdge
            id="bottom-back-right"
            hovered={this.hoveredStandardView === 'bottom-back-right'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom-back-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? 'bottom-back-right'
                : undefined)
            }
          />

          <ViewerViewCubeTopFrontEdge
            id="top-front"
            hovered={this.hoveredStandardView === 'top-front'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-front')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-front' : undefined)
            }
          />
          <ViewerViewCubeBottomFrontEdge
            id="bottom-front"
            hovered={this.hoveredStandardView === 'bottom-front'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom-front')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'bottom-front' : undefined)
            }
          />
          <ViewerViewCubeFrontLeftEdge
            id="front-left"
            hovered={this.hoveredStandardView === 'front-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('front-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'front-left' : undefined)
            }
          />
          <ViewerViewCubeFrontRightEdge
            id="front-right"
            hovered={this.hoveredStandardView === 'front-right'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('front-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'front-right' : undefined)
            }
          />

          <ViewerViewCubeTopBackEdge
            id="top-back"
            hovered={this.hoveredStandardView === 'top-back'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-back')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-back' : undefined)
            }
          />
          <ViewerViewCubeBottomBackEdge
            id="bottom-back"
            hovered={this.hoveredStandardView === 'bottom-back'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom-back')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'bottom-back' : undefined)
            }
          />
          <ViewerViewCubeBackLeftEdge
            id="back-left"
            hovered={this.hoveredStandardView === 'back-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('back-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'back-left' : undefined)
            }
          />
          <ViewerViewCubeBackRightEdge
            id="back-right"
            hovered={this.hoveredStandardView === 'back-right'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('back-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'back-right' : undefined)
            }
          />

          <ViewerViewCubeTopLeftEdge
            id="top-left"
            hovered={this.hoveredStandardView === 'top-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-left' : undefined)
            }
          />
          <ViewerViewCubeTopRightEdge
            id="top-right"
            hovered={this.hoveredStandardView === 'top-right'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('top-right')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'top-right' : undefined)
            }
          />
          <ViewerViewCubeBottomLeftEdge
            id="bottom-left"
            hovered={this.hoveredStandardView === 'bottom-left'}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView('bottom-left')}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered ? 'bottom-left' : undefined)
            }
          />
          <ViewerViewCubeBottomRightEdge
            id="bottom-right"
            hovered={this.hoveredStandardView === 'bottom-right'}
            disabled={this.standardViewsDisabled}
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
      this.viewMatrix = Matrix4.makeIdentity();
    }
  };

  private handleStandardView(view: StandardView): () => Promise<void> {
    if (this.standardViewsDisabled) {
      return async () => undefined;
    } else {
      return async () => {
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
}
