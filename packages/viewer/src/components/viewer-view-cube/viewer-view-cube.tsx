import { Component, h, Prop, State, Watch } from '@stencil/core';
import { Matrix4 } from '@vertexvis/geometry';
import classNames from 'classnames';
import { Orientation, StandardView } from '../../lib/types';
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
   * An orientation that defines the X and Z vectors to orient the world. If
   * `viewer` is set, this property will be populated automatically.
   */
  @Prop({ mutable: true })
  public worldOrientation: Orientation = Orientation.DEFAULT;

  /**
   * The view matrix that specifies the camera's orientation. If `viewer` is
   * set, this property will be populated automatically.
   */
  @Prop({ mutable: true })
  public viewMatrix?: Matrix4.Matrix4 = Matrix4.makeIdentity();

  /**
   * An instance of the viewer to bind to.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private hoveredStandardView?: StandardView;

  protected componentDidLoad(): void {
    this.handleViewerChange(this.viewer, undefined);
  }

  protected render(): h.JSX.IntrinsicElements {
    const rotationMatrix = Matrix4.position(
      this.viewMatrix || Matrix4.makeIdentity(),
      Matrix4.makeIdentity()
    );
    const m = Matrix4.multiply(rotationMatrix, this.worldOrientation.matrix);

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
        `matrix3d(${m.join(', ')})`,
      ].join(' '),
    };

    return (
      <div class={classNames('scene', { ready: this.viewMatrix != null })}>
        <div class="cube" style={style}>
          <ViewerViewCubeSide
            side="front"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.FRONT)}
          >
            {this.zNegativeLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="back"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BACK)}
          >
            {this.zPositiveLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="left"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.LEFT)}
          >
            {this.xNegativeLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="right"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.RIGHT)}
          >
            {this.xPositiveLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="top"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP)}
          >
            {this.yPositiveLabel}
          </ViewerViewCubeSide>
          <ViewerViewCubeSide
            side="bottom"
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BOTTOM)}
          >
            {this.yNegativeLabel}
          </ViewerViewCubeSide>

          <ViewerViewCubeTopFrontLeftEdge
            id="top-front-left"
            hovered={this.hoveredStandardView === StandardView.TOP_FRONT_LEFT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_FRONT_LEFT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_FRONT_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeTopFrontRightEdge
            id="top-front-right"
            hovered={this.hoveredStandardView === StandardView.TOP_FRONT_RIGHT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_FRONT_RIGHT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_FRONT_RIGHT
                : undefined)
            }
          />
          <ViewerViewCubeBottomFrontLeftEdge
            id="bottom-front-left"
            hovered={
              this.hoveredStandardView === StandardView.BOTTOM_FRONT_LEFT
            }
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(
              StandardView.BOTTOM_FRONT_LEFT
            )}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_FRONT_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeBottomFrontRightEdge
            id="bottom-front-right"
            hovered={
              this.hoveredStandardView === StandardView.BOTTOM_FRONT_RIGHT
            }
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(
              StandardView.BOTTOM_FRONT_RIGHT
            )}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_FRONT_RIGHT
                : undefined)
            }
          />

          <ViewerViewCubeTopBackLeftEdge
            id="top-back-left"
            hovered={this.hoveredStandardView === StandardView.TOP_BACK_LEFT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_BACK_LEFT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_BACK_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeTopBackRightEdge
            id="top-back-right"
            hovered={this.hoveredStandardView === StandardView.TOP_BACK_RIGHT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_BACK_RIGHT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_BACK_RIGHT
                : undefined)
            }
          />
          <ViewerViewCubeBottomBackLeftEdge
            id="bottom-back-left"
            hovered={this.hoveredStandardView === StandardView.BOTTOM_BACK_LEFT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BOTTOM_BACK_LEFT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_BACK_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeBottomBackRightEdge
            id="bottom-back-right"
            hovered={
              this.hoveredStandardView === StandardView.BOTTOM_BACK_RIGHT
            }
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(
              StandardView.BOTTOM_BACK_RIGHT
            )}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_BACK_RIGHT
                : undefined)
            }
          />

          <ViewerViewCubeTopFrontEdge
            id="top-front"
            hovered={this.hoveredStandardView === StandardView.TOP_FRONT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_FRONT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_FRONT
                : undefined)
            }
          />
          <ViewerViewCubeBottomFrontEdge
            id="bottom-front"
            hovered={this.hoveredStandardView === StandardView.BOTTOM_FRONT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BOTTOM_FRONT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_FRONT
                : undefined)
            }
          />
          <ViewerViewCubeFrontLeftEdge
            id="front-left"
            hovered={this.hoveredStandardView === StandardView.FRONT_LEFT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.FRONT_LEFT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.FRONT_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeFrontRightEdge
            id="front-right"
            hovered={this.hoveredStandardView === StandardView.FRONT_RIGHT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.FRONT_RIGHT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.FRONT_RIGHT
                : undefined)
            }
          />

          <ViewerViewCubeTopBackEdge
            id="top-back"
            hovered={this.hoveredStandardView === StandardView.TOP_BACK}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_BACK)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_BACK
                : undefined)
            }
          />
          <ViewerViewCubeBottomBackEdge
            id="bottom-back"
            hovered={this.hoveredStandardView === StandardView.BOTTOM_BACK}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BOTTOM_BACK)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_BACK
                : undefined)
            }
          />
          <ViewerViewCubeBackLeftEdge
            id="back-left"
            hovered={this.hoveredStandardView === StandardView.BACK_LEFT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BACK_LEFT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BACK_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeBackRightEdge
            id="back-right"
            hovered={this.hoveredStandardView === StandardView.BACK_RIGHT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BACK_RIGHT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BACK_RIGHT
                : undefined)
            }
          />

          <ViewerViewCubeTopLeftEdge
            id="top-left"
            hovered={this.hoveredStandardView === StandardView.TOP_LEFT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_LEFT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeTopRightEdge
            id="top-right"
            hovered={this.hoveredStandardView === StandardView.TOP_RIGHT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.TOP_RIGHT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.TOP_RIGHT
                : undefined)
            }
          />
          <ViewerViewCubeBottomLeftEdge
            id="bottom-left"
            hovered={this.hoveredStandardView === StandardView.BOTTOM_LEFT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BOTTOM_LEFT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_LEFT
                : undefined)
            }
          />
          <ViewerViewCubeBottomRightEdge
            id="bottom-right"
            hovered={this.hoveredStandardView === StandardView.BOTTOM_RIGHT}
            disabled={this.standardViewsDisabled}
            onMouseDown={this.handleStandardView(StandardView.BOTTOM_RIGHT)}
            onHoverChange={(hovered) =>
              (this.hoveredStandardView = hovered
                ? StandardView.BOTTOM_RIGHT
                : undefined)
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

    this.worldOrientation =
      this.viewer?.frame?.scene.worldOrientation ?? Orientation.DEFAULT;

    if (camera != null) {
      const { position, lookAt, up } = camera;
      this.viewMatrix = Matrix4.makeLookAtView(position, lookAt, up);
    } else {
      this.viewMatrix = Matrix4.makeIdentity();
    }
  };

  private handleStandardView(standardView: StandardView): () => Promise<void> {
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
          const worldStandardView = standardView.transformMatrix(
            this.worldOrientation.matrix
          );

          scene
            .camera()
            .standardView(worldStandardView)
            .viewAll()
            .render(animation);
        }
      };
    }
  }
}
