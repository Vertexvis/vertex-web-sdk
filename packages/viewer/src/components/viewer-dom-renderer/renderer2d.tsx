// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { DepthBuffer, Viewport } from '../../lib/types';
import { FramePerspectiveCamera } from '../../lib/types/frame';
import { parseDomElement } from './renderer-element';

export const Renderer2d: FunctionalComponent = (_, children) => {
  return <div class="root-2d">{children}</div>;
};

export function update2d(
  hostEl: HTMLElement,
  viewport: Viewport,
  projectionMatrix: Matrix4.Matrix4,
  viewMatrix: Matrix4.Matrix4,
  depthBuffer: DepthBuffer | undefined
): void {
  const elements = Array.from(hostEl.children)
    .filter((el) => el.nodeName === 'VERTEX-VIEWER-DOM-ELEMENT')
    .map((element) => {
      const el = element as HTMLVertexViewerDomElementElement;

      const { position, quaternion, scale } = parseDomElement(el);
      const matrixWorld = Matrix4.makeTRS(position, quaternion, scale);
      const positionWorld = Vector3.fromMatrixPosition(matrixWorld);
      const cameraPosition = Vector3.fromMatrixPosition(viewMatrix);
      const distanceToCamera = Vector3.distanceSquared(
        cameraPosition,
        positionWorld
      );
      const occluded =
        !el.occlusionOff && depthBuffer?.isOccluded(positionWorld, viewport);

      return {
        element: el,
        positionWorld,
        distanceToCamera,
        occluded,
      };
    })
    .sort((a, b) => a.distanceToCamera - b.distanceToCamera);

  const projectionViewMatrix = Matrix4.multiply(projectionMatrix, viewMatrix);
  for (let i = 0; i < elements.length; i++) {
    const { element, positionWorld, occluded } = elements[i];
    element.occluded = occluded ?? false;
    updateTransform(element, viewport, positionWorld, projectionViewMatrix);
    updateDepth(element, i, elements.length);
  }
}

function updateTransform(
  element: HTMLVertexViewerDomElementElement,
  viewport: Viewport,
  worldPt: Vector3.Vector3,
  projectionViewMatrix: Matrix4.Matrix4
): void {
  const ndcPt = Vector3.transformMatrix(worldPt, projectionViewMatrix);
  const screenPt = viewport.transformNdc(ndcPt);

  element.style.transform = [
    `translate(-50%, -50%)`,
    `translate(${screenPt.x}px, ${screenPt.y}px)`,
  ].join(' ');
}

function updateDepth(
  element: HTMLVertexViewerDomElementElement,
  index: number,
  elementCount: number
): void {
  element.style.zIndex = `${elementCount - index}`;
}
