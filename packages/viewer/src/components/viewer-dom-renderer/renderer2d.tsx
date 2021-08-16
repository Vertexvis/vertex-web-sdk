// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { DepthBuffer, Viewport } from '../../lib/types';
import { FramePerspectiveCamera } from '../../lib/types/frame';
import { isVertexViewerDomElement } from '../viewer-dom-element/utils';
import { isVertexViewerDomGroup } from '../viewer-dom-group/utils';

interface ElementData {
  element: HTMLVertexViewerDomElementElement;
  worldMatrix: Matrix4.Matrix4;
  worldPosition: Vector3.Vector3;
  distanceToCamera: number;
}

export const Renderer2d: FunctionalComponent = (_, children) => {
  return <div class="root-2d">{children}</div>;
};

export function update2d(
  hostEl: HTMLElement,
  parentWorldMatrix: Matrix4.Matrix4,
  viewport: Viewport,
  camera: FramePerspectiveCamera,
  depthBuffer: DepthBuffer | undefined
): void {
  const elements = getElementDepths(hostEl, parentWorldMatrix, camera).sort(
    (a, b) => a.distanceToCamera - b.distanceToCamera
  );

  for (let i = 0; i < elements.length; i++) {
    const { element, worldMatrix, worldPosition } = elements[i];

    const occluded =
      !element.occlusionOff && depthBuffer?.isOccluded(worldPosition, viewport);
    element.occluded = occluded ?? false;

    const screenPt = getScreenPosition(
      worldPosition,
      camera.projectionViewMatrix,
      viewport
    );
    updateTransform(element, screenPt);
    updateDepth(element, i, elements.length);
    update2d(element, worldMatrix, viewport, camera, depthBuffer);
  }
}

function getElementDepths(
  element: HTMLElement,
  parentWorldMatrix: Matrix4.Matrix4,
  camera: FramePerspectiveCamera
): ElementData[] {
  const results = [] as ElementData[];

  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];

    if (isVertexViewerDomGroup(child)) {
      const worldMatrix = Matrix4.multiply(parentWorldMatrix, child.matrix);
      results.push(...getElementDepths(child, worldMatrix, camera));
    } else if (isVertexViewerDomElement(child)) {
      const worldMatrix = Matrix4.multiply(parentWorldMatrix, child.matrix);
      const worldPosition = Vector3.fromMatrixPosition(worldMatrix);
      const distanceToCamera = Vector3.distanceSquared(
        camera.position,
        worldPosition
      );
      results.push({
        element: child,
        worldMatrix,
        worldPosition,
        distanceToCamera,
      });
    }
  }

  return results;
}

function updateTransform(
  element: HTMLVertexViewerDomElementElement,
  relativePt: Point.Point
): void {
  element.style.transform = [
    `translate(-50%, -50%)`,
    `translate(${relativePt.x}px, ${relativePt.y}px)`,
  ].join(' ');
}

function updateDepth(
  element: HTMLVertexViewerDomElementElement,
  index: number,
  elementCount: number
): void {
  element.style.zIndex = `${elementCount - index}`;
}

function getScreenPosition(
  pt: Vector3.Vector3,
  projectionViewMatrix: Matrix4.Matrix4,
  viewport: Viewport
): Point.Point {
  const ndcPt = Vector3.transformMatrix(pt, projectionViewMatrix);
  return viewport.transformVectorToViewport(ndcPt);
}
