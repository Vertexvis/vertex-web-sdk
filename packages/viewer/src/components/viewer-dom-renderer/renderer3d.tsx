// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { DepthBuffer, Viewport } from '../../lib/types';
import { ReceivedPerspectiveCamera } from '../../lib/types/frame';
import { parseDomElement } from './renderer-element';

interface Props {
  camera: ReceivedPerspectiveCamera;
  viewport: Viewport;
}

export const Renderer3d: FunctionalComponent<Props> = (
  { camera, viewport },
  children
) => {
  const pMatrix = Matrix4.toObject(camera.projectionMatrix);
  const fovY = pMatrix.m22 * (viewport.height / 2);
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
  hostEl: HTMLElement,
  viewport: Viewport,
  camera: ReceivedPerspectiveCamera,
  depthBuffer: DepthBuffer | undefined
): void {
  for (let i = 0; i < hostEl.children.length; i++) {
    const el = hostEl.children[i];
    if (el.nodeName === 'VERTEX-VIEWER-DOM-ELEMENT') {
      updateElement(
        el as HTMLVertexViewerDomElementElement,
        viewport,
        camera,
        depthBuffer
      );
    }
  }
}

function updateElement(
  element: HTMLVertexViewerDomElementElement,
  viewport: Viewport,
  camera: ReceivedPerspectiveCamera,
  depthBuffer: DepthBuffer | undefined
): void {
  const { position, quaternion, scale } = parseDomElement(element);

  const matrixWorld = Matrix4.makeTRS(position, quaternion, scale);
  const positionWorld = Vector3.fromMatrixPosition(matrixWorld);

  const occluded = depthBuffer?.isOccluded(viewport, positionWorld);
  element.occluded = occluded ?? false;

  if (element.billboardOff) {
    element.style.transform = getElementCssMatrix(matrixWorld);
  } else {
    let m = camera.viewMatrix;
    m = Matrix4.transpose(m);
    m = Matrix4.position(m, matrixWorld);
    m = Matrix4.scale(m, scale);

    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;

    element.style.transform = getElementCssMatrix(m);
  }
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
