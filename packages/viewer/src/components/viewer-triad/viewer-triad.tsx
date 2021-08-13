import { Component, Host, h, Prop, Watch, State } from '@stencil/core';
import { Euler, Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';
import { FramePerspectiveCamera, Orientation } from '../../lib/types';

@Component({
  tag: 'vertex-viewer-triad',
  styleUrl: 'viewer-triad.css',
  shadow: true,
})
export class ViewerTriad {
  @State()
  private viewMatrix?: Matrix4.Matrix4;

  @State()
  private projectionMatrix = Matrix4.makeIdentity();

  @State()
  private cubeRotationMatrix = Matrix4.makeIdentity();

  @State()
  private boxLength = 80;

  /**
   * An orientation that defines the X and Z vectors to orient the world. If
   * `viewer` is set, this property will be populated automatically.
   */
  @Prop({ mutable: true })
  public worldOrientation: Orientation = Orientation.DEFAULT;

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
      this.worldOrientation = this.viewer.frame.scene.worldOrientation;

      // Used to scale the camera position so the cube is the same size as the
      // container. This isn't exact, but pretty close.
      const lengthScalar = 3.125;
      const scale = this.boxLength * lengthScalar;
      const fovY = 21.5;

      const position = Vector3.scale(scale, camera.direction);
      this.viewMatrix = Matrix4.makeLookAtView(
        position,
        Vector3.origin(),
        camera.up
      );

      const rotationMatrix = Matrix4.multiply(
        Matrix4.position(camera.viewMatrix, Matrix4.makeIdentity()),
        this.worldOrientation.matrix
      );
      this.cubeRotationMatrix = rotationMatrix;

      this.projectionMatrix = Matrix4.makePerspective(0.1, 100, fovY, 1);
    }
  };

  protected componentDidLoad(): void {
    this.handleViewerChanged(this.viewer);
  }

  protected render(): h.JSX.IntrinsicElements {
    const halfLength = this.boxLength / 2;
    const triadPos = Vector3.create(
      -halfLength - 5,
      -halfLength - 5,
      -halfLength - 5
    );
    const xLabelPos = Vector3.add(triadPos, {
      x: this.boxLength + 15,
      y: 0,
      z: 0,
    });
    const yLabelPos = Vector3.add(triadPos, {
      x: 0,
      y: this.boxLength + 15,
      z: 0,
    });
    const zLabelPos = Vector3.add(triadPos, {
      x: 0,
      y: 0,
      z: this.boxLength + 15,
    });

    const xRot1 = Euler.create({ x: 0, y: 0, z: 0 });
    const xRot2 = Euler.create({ x: Math.PI / 2, y: 0, z: 0 });

    const yRot1 = Euler.create({ x: 0, y: 0, z: -Math.PI / 2 });
    const yRot2 = Euler.create({ x: Math.PI / 2, y: 0, z: -Math.PI / 2 });

    const zRot1 = Euler.create({ x: 0, y: Math.PI / 2, z: 0 });
    const zRot2 = Euler.create({ x: Math.PI / 2, y: Math.PI / 2, z: 0 });

    const frontPos = Vector3.create(0, 0, halfLength);
    const backPos = Vector3.create(0, 0, -halfLength);
    const leftPos = Vector3.create(halfLength, 0, 0);
    const rightPos = Vector3.create(-halfLength, 0, 0);
    const topPos = Vector3.create(0, halfLength, 0);
    const bottomPos = Vector3.create(0, -halfLength, 0);

    const frontRot = Quaternion.fromAxisAngle(Vector3.origin(), 0);
    const backRot = Quaternion.fromAxisAngle(Vector3.up(), Math.PI);
    const leftRot = Quaternion.fromAxisAngle(Vector3.up(), Math.PI / 2);
    const rightRot = Quaternion.fromAxisAngle(Vector3.up(), -Math.PI / 2);
    const topRot = Quaternion.fromAxisAngle(Vector3.right(), -Math.PI / 2);
    const bottomRot = Quaternion.fromAxisAngle(Vector3.right(), Math.PI / 2);

    const scale = Vector3.create(1, 1, 1);

    const frontMat = Matrix4.makeTRS(frontPos, frontRot, scale);
    const backMat = Matrix4.makeTRS(backPos, backRot, scale);
    const leftMat = Matrix4.makeTRS(leftPos, leftRot, scale);
    const rightMat = Matrix4.makeTRS(rightPos, rightRot, scale);
    const topMat = Matrix4.makeTRS(topPos, topRot, scale);
    const bottomMat = Matrix4.makeTRS(bottomPos, bottomRot, scale);

    const frontPos2 = Vector3.fromMatrixPosition(frontMat);
    const frontRot2 = Quaternion.fromMatrixRotation(frontMat);
    const backPos2 = Vector3.fromMatrixPosition(backMat);
    const backRot2 = Quaternion.fromMatrixRotation(backMat);
    const leftPos2 = Vector3.fromMatrixPosition(leftMat);
    const leftRot2 = Quaternion.fromMatrixRotation(leftMat);
    const rightPos2 = Vector3.fromMatrixPosition(rightMat);
    const rightRot2 = Quaternion.fromMatrixRotation(rightMat);
    const topPos2 = Vector3.fromMatrixPosition(topMat);
    const topRot2 = Quaternion.fromMatrixRotation(topMat);
    const bottomPos2 = Vector3.fromMatrixPosition(bottomMat);
    const bottomRot2 = Quaternion.fromMatrixRotation(bottomMat);

    const axisStyles = { width: `${this.boxLength + 5}px` };

    const boxStyles = {
      width: `${this.boxLength}px`,
      height: `${this.boxLength}px`,
    };

    return (
      <Host>
        <vertex-viewer-dom-renderer
          class="renderer"
          projectionMatrix={this.projectionMatrix}
          viewMatrix={this.viewMatrix}
        >
          <vertex-viewer-dom-element position="[0, 0, 0]" scale="[1, 1, 1]">
            <div class="reference-point" />
          </vertex-viewer-dom-element>

          {/* Triad */}
          <vertex-viewer-dom-element
            position={triadPos}
            scale="[1, 1, 1]"
            rotation={JSON.stringify(xRot1)}
            style={axisStyles}
            billboardOff
          >
            <div class="axis axis-x" />
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={triadPos}
            scale="[1, 1, 1]"
            rotation={JSON.stringify(xRot2)}
            style={axisStyles}
            billboardOff
          >
            <div class="axis axis-x" />
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element position={xLabelPos} scale="[1, 1, 1]">
            <div class="label label-x">X</div>
          </vertex-viewer-dom-element>

          <vertex-viewer-dom-element
            position={triadPos}
            scale="[1, 1, 1]"
            rotation={JSON.stringify(yRot1)}
            style={axisStyles}
            billboardOff
          >
            <div class="axis axis-y" />
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={triadPos}
            scale="[1, 1, 1]"
            rotation={JSON.stringify(yRot2)}
            style={axisStyles}
            billboardOff
          >
            <div class="axis axis-y" />
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element position={yLabelPos} scale="[1, 1, 1]">
            <div class="label label-y">Y</div>
          </vertex-viewer-dom-element>

          <vertex-viewer-dom-element
            position={triadPos}
            scale="[1, 1, 1]"
            rotation={JSON.stringify(zRot1)}
            style={axisStyles}
            billboardOff
          >
            <div class="axis axis-z" />
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={triadPos}
            scale="[1, 1, 1]"
            rotation={JSON.stringify(zRot2)}
            style={axisStyles}
            billboardOff
          >
            <div class="axis axis-z" />
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element position={zLabelPos} scale="[1, 1, 1]">
            <div class="label label-z">Z</div>
          </vertex-viewer-dom-element>

          {/* Cube */}
          <vertex-viewer-dom-element
            position={frontPos2}
            scale="[1, 1, 1]"
            rotation={frontRot2}
            style={boxStyles}
            billboardOff
          >
            <div class="cube-side">Front</div>
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={backPos2}
            scale="[1, 1, 1]"
            rotation={backRot2}
            style={boxStyles}
            billboardOff
          >
            <div class="cube-side">Back</div>
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={leftPos2}
            scale="[1, 1, 1]"
            rotation={leftRot2}
            style={boxStyles}
            billboardOff
          >
            <div class="cube-side">Left</div>
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={rightPos2}
            scale="[1, 1, 1]"
            rotation={rightRot2}
            style={boxStyles}
            billboardOff
          >
            <div class="cube-side">Right</div>
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={topPos2}
            scale="[1, 1, 1]"
            rotation={topRot2}
            style={boxStyles}
            billboardOff
          >
            <div class="cube-side">Top</div>
          </vertex-viewer-dom-element>
          <vertex-viewer-dom-element
            position={bottomPos2}
            scale="[1, 1, 1]"
            rotation={bottomRot2}
            style={boxStyles}
            billboardOff
          >
            <div class="cube-side">Bottom</div>
          </vertex-viewer-dom-element>
        </vertex-viewer-dom-renderer>
      </Host>
    );
  }
}
