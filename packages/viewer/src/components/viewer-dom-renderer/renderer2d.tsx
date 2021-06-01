// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Dimensions, Matrix4, Vector3 } from '@vertexvis/geometry';
import { parseDomElement } from './renderer-element';

export const Renderer2d: FunctionalComponent = (_, children) => {
  return <div class="root-2d">{children}</div>;
};

export function update2d(
  hostEl: HTMLElement,
  halfDim: Dimensions.Dimensions,
  cameraPosition: Vector3.Vector3,
  viewProjectionMatrix: Matrix4.Matrix4
): void {
  const elements = Array.from(hostEl.children)
    .filter((el) => el.nodeName === 'VERTEX-VIEWER-DOM-ELEMENT')
    .map((element) => {
      const el = element as HTMLVertexViewerDomElementElement;

      const { position, quaternion, scale } = parseDomElement(el);
      const matrixWorld = Matrix4.makeTRS(position, quaternion, scale);
      const positionWorld = Vector3.fromMatrixPosition(matrixWorld);
      const distanceToCamera = Vector3.distanceToSquared(
        cameraPosition,
        positionWorld
      );

      return {
        element: el,
        positionWorld,
        distanceToCamera,
      };
    })
    .sort((a, b) => a.distanceToCamera - b.distanceToCamera);

  for (let i = 0; i < elements.length; i++) {
    const { element, positionWorld } = elements[i];
    updateTransform(element, halfDim, positionWorld, viewProjectionMatrix);
    updateDepth(element, i, elements.length);
  }
}

function updateTransform(
  element: HTMLVertexViewerDomElementElement,
  halfDim: Dimensions.Dimensions,
  positionWorld: Vector3.Vector3,
  viewProjectionMatrix: Matrix4.Matrix4
): void {
  const position = Vector3.transformMatrix(positionWorld, viewProjectionMatrix);

  element.style.transform = [
    `translate(-50%, -50%)`,
    `translate(${position.x * halfDim.width + halfDim.width}px, ${
      -position.y * halfDim.height + halfDim.height
    }px)`,
  ].join(' ');
}

function updateDepth(
  element: HTMLVertexViewerDomElementElement,
  index: number,
  elementCount: number
): void {
  element.style.zIndex = `${elementCount - index}`;
}
