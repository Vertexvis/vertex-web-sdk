// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { DepthBuffer, Viewport } from '../../lib/types';
import { ReceivedPerspectiveCamera } from '../../lib/types/frame';
import { parseDomElement } from './renderer-element';

export const Renderer2d: FunctionalComponent = (_, children) => {
  return <div class="root-2d">{children}</div>;
};

export function update2d(
  hostEl: HTMLElement,
  viewport: Viewport,
  camera: ReceivedPerspectiveCamera,
  depthBuffer: DepthBuffer | undefined
): void {
  const elements = Array.from(hostEl.children)
    .filter((el) => el.nodeName === 'VERTEX-VIEWER-DOM-ELEMENT')
    .map((element) => {
      const el = element as HTMLVertexViewerDomElementElement;

      const { position, quaternion, scale } = parseDomElement(el);
      const matrixWorld = Matrix4.makeTRS(position, quaternion, scale);
      const positionWorld = Vector3.fromMatrixPosition(matrixWorld);
      const distanceToCamera = Vector3.distanceSquared(
        camera.position,
        positionWorld
      );
      const occluded = depthBuffer?.isOccluded(viewport, positionWorld);

      return {
        element: el,
        positionWorld,
        distanceToCamera,
        occluded,
      };
    })
    .sort((a, b) => a.distanceToCamera - b.distanceToCamera);

  for (let i = 0; i < elements.length; i++) {
    const { element, positionWorld, occluded } = elements[i];
    element.occluded = occluded ?? false;
    updateTransform(element, viewport, positionWorld, camera);
    updateDepth(element, i, elements.length);
  }
}

function updateTransform(
  element: HTMLVertexViewerDomElementElement,
  viewport: Viewport,
  worldPt: Vector3.Vector3,
  camera: ReceivedPerspectiveCamera
): void {
  const ndcPt = Vector3.transformMatrix(worldPt, camera.projectionViewMatrix);
  const screenPt = viewport.transformPoint(ndcPt);

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
