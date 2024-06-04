// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Matrix4, Vector3 } from '@vertexvis/geometry';

import { DepthBuffer, Viewport } from '../../lib/types';
import { FrameCameraBase } from '../../lib/types/frame';
import { isVertexViewerDomElement } from '../viewer-dom-element/utils';
import { isVertexViewerDomGroup } from '../viewer-dom-group/utils';

interface Props {
  camera: FrameCameraBase;
  viewport: Viewport;
}

export const Renderer3d: FunctionalComponent<Props> = (
  { camera, viewport },
  children
) => {
  const pMatrix = Matrix4.toObject(camera.projectionMatrix);
  const fovY = camera.isOrthographic()
    ? ((camera.far * 2) / (camera.fovHeight * 2)) * (viewport.height / 2)
    : pMatrix.m22 * (viewport.height / 2);
  const cameraTransform = [
    `translateZ(${fovY}px)`,
    getCameraCssMatrix(camera.viewMatrix),
    `translate(${viewport.width / 2}px, ${viewport.height / 2}px)`,
  ].join(' ');

  return (
    <div class="root-3d" style={{ perspective: `${fovY}px` }}>
      <div class="camera" style={{ transform: cameraTransform }}>
        {children}
      </div>
    </div>
  );
};

export function update3d(
  element: HTMLElement,
  parentWorldMatrix: Matrix4.Matrix4,
  viewport: Viewport,
  camera: FrameCameraBase,
  depthBuffer: DepthBuffer | undefined
): void {
  for (let i = 0; i < element.children.length; i++) {
    const el = element.children[i] as HTMLElement;
    if (isVertexViewerDomElement(el)) {
      updateElement(
        el as HTMLVertexViewerDomElementElement,
        parentWorldMatrix,
        viewport,
        camera,
        depthBuffer
      );
    } else if (isVertexViewerDomGroup(el)) {
      updateGroup(el, parentWorldMatrix, viewport, camera, depthBuffer);
    } else {
      update3d(el, parentWorldMatrix, viewport, camera, depthBuffer);
    }
  }
}

function updateElement(
  element: HTMLVertexViewerDomElementElement,
  parentWorldMatrix: Matrix4.Matrix4,
  viewport: Viewport,
  camera: FrameCameraBase,
  depthBuffer: DepthBuffer | undefined
): void {
  const worldMatrix = Matrix4.multiply(parentWorldMatrix, element.matrix);

  const positionWorld = Vector3.fromMatrixPosition(worldMatrix);
  const depthBufferIsNull = depthBuffer == null;
  const occluded =
    depthBufferIsNull ||
    (!element.occlusionOff && depthBuffer?.isOccluded(positionWorld, viewport));
  element.occluded = occluded ?? false;
  const detached =
    depthBufferIsNull ||
    (!element.detachedOff && depthBuffer?.isDetached(positionWorld, viewport));
  element.detached = detached ?? false;
  element.classList.add('ready');

  if (element.billboardOff) {
    element.style.transform = getElementCssMatrix(worldMatrix);
  } else {
    let m = camera.viewMatrix;
    m = Matrix4.transpose(m);
    m = Matrix4.position(m, worldMatrix);
    m = Matrix4.scale(m, element.scale);

    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;

    element.style.transform = getElementCssMatrix(m);
  }

  update3d(element, worldMatrix, viewport, camera, depthBuffer);
}

function updateGroup(
  element: HTMLVertexViewerDomGroupElement,
  parentWorldMatrix: Matrix4.Matrix4,
  viewport: Viewport,
  camera: FrameCameraBase,
  depthBuffer: DepthBuffer | undefined
): void {
  const worldMatrix = Matrix4.multiply(parentWorldMatrix, element.matrix);
  update3d(element, worldMatrix, viewport, camera, depthBuffer);
}

function getCameraCssMatrix(viewMatrix: Matrix4.Matrix4): string {
  const elements = [
    epsilon(viewMatrix[0]),
    epsilon(-viewMatrix[1]),
    epsilon(viewMatrix[2]),
    epsilon(viewMatrix[3]),
    epsilon(viewMatrix[4]),
    epsilon(-viewMatrix[5]),
    epsilon(viewMatrix[6]),
    epsilon(viewMatrix[7]),
    epsilon(viewMatrix[8]),
    epsilon(-viewMatrix[9]),
    epsilon(viewMatrix[10]),
    epsilon(viewMatrix[11]),
    epsilon(viewMatrix[12]),
    epsilon(-viewMatrix[13]),
    epsilon(viewMatrix[14]),
    epsilon(viewMatrix[15]),
  ].join(', ');
  return `matrix3d(${elements})`;
}

function getElementCssMatrix(matrix: Matrix4.Matrix4): string {
  const values = [
    epsilon(matrix[0]),
    epsilon(matrix[1]),
    epsilon(matrix[2]),
    epsilon(matrix[3]),
    epsilon(-matrix[4]),
    epsilon(-matrix[5]),
    epsilon(-matrix[6]),
    epsilon(-matrix[7]),
    epsilon(matrix[8]),
    epsilon(matrix[9]),
    epsilon(matrix[10]),
    epsilon(matrix[11]),
    epsilon(matrix[12]),
    epsilon(matrix[13]),
    epsilon(matrix[14]),
    epsilon(matrix[15]),
  ].join(', ');

  return [`translate(-50%, -50%)`, `matrix3d(${values})`].join(' ');
}

function epsilon(value: number): number {
  return Math.abs(value) < 1e-10 ? 0 : value;
}
