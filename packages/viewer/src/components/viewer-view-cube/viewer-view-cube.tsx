/* eslint-disable @typescript-eslint/member-ordering */

import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { Plane, Ray, Vector3 } from '@vertexvis/geometry';

import { readDOM } from '../../lib/stencil';
import {
  FramePerspectiveCamera,
  Orientation,
  StandardView,
} from '../../lib/types';
import {
  TriadAxis,
  ViewCubeCorner,
  ViewCubeEdge,
  ViewCubeShadow,
  ViewCubeSide,
} from './viewer-view-cube-components';

@Component({
  tag: 'vertex-viewer-view-cube',
  styleUrl: 'viewer-view-cube.css',
  shadow: true,
})
export class ViewerViewCube {
  private rendererEl?: HTMLVertexViewerDomRendererElement;

  @State()
  private boxLength = 80;

  @State()
  private triadPosition = Vector3.origin();

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
  public zPositiveLabel = 'Front';

  /**
   * The label for the side of the cube on the negative z-axis.
   */
  @Prop()
  public zNegativeLabel = 'Back';

  /**
   * Disables interactions for standard views.
   */
  @Prop()
  public standardViewsOff = false;

  /**
   * Whether to perform a `fitAll` when clicking on the view cube. If this
   * is set to `false`, the current `lookAt` point will be maintained, and the
   * camera's `position` and `up` vectors will be aligned to the standard view.
   * Defaults to `true`.
   *
   * **Note** Setting this value to `false` can result in the camera being placed
   * underneath geometry depending on the current `viewVector` length, resulting
   * in a view that may be unexpected.
   */
  @Prop()
  public fitAll = true;

  /**
   * The duration of the animation, in milliseconds, when a user performs a
   * standard view interaction. Set to 0 to disable animations.
   */
  @Prop()
  public animationDuration = 500;

  /**
   * Disables the display of the triad.
   */
  @Prop()
  public triadOff = false;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public worldOrientation: Orientation = Orientation.DEFAULT;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public camera?: FramePerspectiveCamera;

  /**
   * The viewer element that is connected to the view cube.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.updateMatrices);
    newViewer?.addEventListener('frameDrawn', this.updateMatrices);
    this.updateMatrices();
  }

  private updateMatrices = (): void => {
    if (this.viewer?.frame != null) {
      const { camera } = this.viewer.frame.scene;

      const halfLength = this.boxLength / 2;
      this.triadPosition = Vector3.create(
        -halfLength - 5,
        -halfLength - 5,
        -halfLength - 5
      );

      // Used to scale the camera position so the cube is the same size as the
      // container. This isn't exact, but pretty close.
      const lengthScalar = 3.125;
      const scale = this.boxLength * lengthScalar;
      const fovY = 21.5;

      this.camera = new FramePerspectiveCamera(
        Vector3.scale(scale, Vector3.negate(camera.direction)),
        Vector3.origin(),
        camera.up,
        0.1,
        100,
        1,
        fovY
      );

      this.worldOrientation = this.viewer.frame.scene.worldOrientation;
    }
  };

  private handleStandardView(standardView: StandardView): () => Promise<void> {
    if (this.standardViewsOff) {
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

          // Check to see if any geometry is visible. If not, don't perform viewAll
          const currentBoundingBox = scene.boundingBox();
          if (!this.fitAll) {
            scene
              .camera()
              .standardViewFixedLookAt(worldStandardView)
              .render(animation);
          } else if (
            currentBoundingBox?.max != null &&
            Vector3.isEqual(currentBoundingBox.max, Vector3.origin()) &&
            Vector3.isEqual(currentBoundingBox.min, Vector3.origin())
          ) {
            scene.camera().standardView(worldStandardView).render(animation);
          } else {
            scene
              .camera()
              .standardView(worldStandardView)
              .viewAll()
              .render(animation);
          }
        }
      };
    }
  }

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.handleViewerChanged(this.viewer);
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    if (this.rendererEl != null) {
      const observer = new ResizeObserver(() => this.handleRendererResized());
      observer.observe(this.rendererEl);
      this.handleRendererResized();
    }
  }

  private handleRendererResized(): void {
    readDOM(() => {
      if (this.rendererEl != null) {
        const rect = this.rendererEl.getBoundingClientRect();
        this.boxLength = Math.min(rect.width, rect.height);
      }
    });
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <vertex-viewer-dom-renderer
          ref={(ref) => (this.rendererEl = ref)}
          class="renderer"
          camera={this.camera}
        >
          {/* Triad */}
          {!this.triadOff && (
            <vertex-viewer-dom-group
              class="triad"
              position={this.triadPosition}
            >
              <TriadAxis
                label="X"
                length={this.boxLength}
                rotationAxis={Vector3.origin()}
              />
              <TriadAxis
                label="Y"
                length={this.boxLength}
                rotationAxis={Vector3.back()}
              />
              <TriadAxis
                label="Z"
                length={this.boxLength}
                rotationAxis={Vector3.down()}
              />
            </vertex-viewer-dom-group>
          )}

          {/* Cube */}
          <vertex-viewer-dom-group
            class="cube"
            matrix={this.worldOrientation.matrix}
          >
            <ViewCubeShadow length={this.boxLength + 10} />

            {/* Sides */}
            <ViewCubeSide
              label={this.zPositiveLabel}
              length={this.boxLength}
              side="front"
              onPointerDown={this.handleStandardView(StandardView.FRONT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeSide
              label={this.zNegativeLabel}
              length={this.boxLength}
              side="back"
              onPointerDown={this.handleStandardView(StandardView.BACK)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeSide
              label={this.xNegativeLabel}
              length={this.boxLength}
              side="left"
              onPointerDown={this.handleStandardView(StandardView.RIGHT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeSide
              label={this.xPositiveLabel}
              length={this.boxLength}
              side="right"
              onPointerDown={this.handleStandardView(StandardView.LEFT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeSide
              label={this.yPositiveLabel}
              length={this.boxLength}
              side="top"
              onPointerDown={this.handleStandardView(StandardView.TOP)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeSide
              label={this.yNegativeLabel}
              length={this.boxLength}
              side="bottom"
              onPointerDown={this.handleStandardView(StandardView.BOTTOM)}
              disabled={this.standardViewsOff}
            />

            {/* Edges */}
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="top"
              face1Edge="bottom"
              face2Side="front"
              face2Edge="top"
              onPointerDown={this.handleStandardView(StandardView.TOP_FRONT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="front"
              face1Edge="right"
              face2Side="right"
              face2Edge="left"
              onPointerDown={this.handleStandardView(StandardView.FRONT_LEFT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="bottom"
              face1Edge="top"
              face2Side="front"
              face2Edge="bottom"
              onPointerDown={this.handleStandardView(StandardView.BOTTOM_FRONT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="front"
              face1Edge="left"
              face2Side="left"
              face2Edge="right"
              onPointerDown={this.handleStandardView(StandardView.FRONT_RIGHT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="top"
              face1Edge="right"
              face2Side="right"
              face2Edge="top"
              onPointerDown={this.handleStandardView(StandardView.TOP_LEFT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="back"
              face1Edge="left"
              face2Side="right"
              face2Edge="right"
              onPointerDown={this.handleStandardView(StandardView.BACK_LEFT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="bottom"
              face1Edge="right"
              face2Side="right"
              face2Edge="bottom"
              onPointerDown={this.handleStandardView(StandardView.BOTTOM_LEFT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="top"
              face1Edge="top"
              face2Side="back"
              face2Edge="top"
              onPointerDown={this.handleStandardView(StandardView.TOP_BACK)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="back"
              face1Edge="right"
              face2Side="left"
              face2Edge="left"
              onPointerDown={this.handleStandardView(StandardView.BACK_RIGHT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="bottom"
              face1Edge="bottom"
              face2Side="back"
              face2Edge="bottom"
              onPointerDown={this.handleStandardView(StandardView.BOTTOM_BACK)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="top"
              face1Edge="left"
              face2Side="left"
              face2Edge="top"
              onPointerDown={this.handleStandardView(StandardView.TOP_RIGHT)}
              disabled={this.standardViewsOff}
            />
            <ViewCubeEdge
              length={this.boxLength}
              face1Side="bottom"
              face1Edge="left"
              face2Side="left"
              face2Edge="bottom"
              onPointerDown={this.handleStandardView(StandardView.BOTTOM_RIGHT)}
              disabled={this.standardViewsOff}
            />

            {/* Corners */}
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="top"
              face1Corner="bottom-left"
              face2Side="front"
              face2Corner="top-left"
              face3Side="left"
              face3Corner="top-right"
              onPointerDown={this.handleStandardView(
                StandardView.TOP_FRONT_RIGHT
              )}
              disabled={this.standardViewsOff}
            />
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="top"
              face1Corner="bottom-right"
              face2Side="front"
              face2Corner="top-right"
              face3Side="right"
              face3Corner="top-left"
              onPointerDown={this.handleStandardView(
                StandardView.TOP_FRONT_LEFT
              )}
              disabled={this.standardViewsOff}
            />
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="bottom"
              face1Corner="top-right"
              face2Side="front"
              face2Corner="bottom-right"
              face3Side="right"
              face3Corner="bottom-left"
              onPointerDown={this.handleStandardView(
                StandardView.BOTTOM_FRONT_LEFT
              )}
              disabled={this.standardViewsOff}
            />
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="bottom"
              face1Corner="top-left"
              face2Side="front"
              face2Corner="bottom-left"
              face3Side="left"
              face3Corner="bottom-right"
              onPointerDown={this.handleStandardView(
                StandardView.BOTTOM_FRONT_RIGHT
              )}
              disabled={this.standardViewsOff}
            />
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="top"
              face1Corner="top-right"
              face2Side="back"
              face2Corner="top-left"
              face3Side="right"
              face3Corner="top-right"
              onPointerDown={this.handleStandardView(
                StandardView.TOP_BACK_LEFT
              )}
              disabled={this.standardViewsOff}
            />
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="top"
              face1Corner="top-left"
              face2Side="back"
              face2Corner="top-right"
              face3Side="left"
              face3Corner="top-left"
              onPointerDown={this.handleStandardView(
                StandardView.TOP_BACK_RIGHT
              )}
              disabled={this.standardViewsOff}
            />
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="bottom"
              face1Corner="bottom-left"
              face2Side="back"
              face2Corner="bottom-right"
              face3Side="left"
              face3Corner="bottom-left"
              onPointerDown={this.handleStandardView(
                StandardView.BOTTOM_BACK_RIGHT
              )}
              disabled={this.standardViewsOff}
            />
            <ViewCubeCorner
              length={this.boxLength}
              face1Side="bottom"
              face1Corner="bottom-right"
              face2Side="back"
              face2Corner="bottom-left"
              face3Side="right"
              face3Corner="bottom-right"
              onPointerDown={this.handleStandardView(
                StandardView.BOTTOM_BACK_LEFT
              )}
              disabled={this.standardViewsOff}
            />
          </vertex-viewer-dom-group>
        </vertex-viewer-dom-renderer>
      </Host>
    );
  }
}
