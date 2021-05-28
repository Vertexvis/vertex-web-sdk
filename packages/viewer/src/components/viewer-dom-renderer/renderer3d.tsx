// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Dimensions, Matrix4 } from '@vertexvis/geometry';

interface Props {
  viewMatrix: Matrix4.Matrix4;
  projectionMatrix: Matrix4.Matrix4;
  dimensions: Dimensions.Dimensions;
}

export const Renderer3d: FunctionalComponent<Props> = (
  { projectionMatrix, viewMatrix, dimensions },
  children
) => {
  const pMatrix = Matrix4.toRowMajor(projectionMatrix);
  const fovY = pMatrix.m22 * (dimensions.height / 2);
  const cameraTransform = [
    `translateZ(${fovY}px)`,
    getCameraCssMatrix(viewMatrix),
    `translate(${dimensions.width / 2}px, ${dimensions.height / 2}px)`,
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
  viewMatrix: Matrix4.Matrix4
): void {
  for (let i = 0; i < hostEl.children.length; i++) {
    const el = hostEl.children[i];
    if (el.nodeName === 'VERTEX-VIEWER-DOM-ELEMENT') {
      updateElement(el as HTMLVertexViewerDomElementElement, viewMatrix);
    }
  }
}

function updateElement(
  element: HTMLVertexViewerDomElementElement,
  viewMatrix: Matrix4.Matrix4
): void {
  const matrixWorld = Matrix4.makeTRS(
    element.position,
    element.quaternion,
    element.scale
  );

  if (element.billboard) {
    let m = viewMatrix;
    m = Matrix4.transpose(m);
    m = Matrix4.position(m, matrixWorld);
    m = Matrix4.scale(m, element.scale);

    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;

    element.style.transform = getElementCssMatrix(m);
  } else {
    element.style.transform = getElementCssMatrix(matrixWorld);
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
