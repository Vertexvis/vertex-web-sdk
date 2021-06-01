import { Euler, Quaternion, Vector3 } from '@vertexvis/geometry';

export interface RendererElement {
  position: Vector3.Vector3;
  quaternion: Quaternion.Quaternion;
  scale: Vector3.Vector3;
}

export function parseDomElement(
  element: HTMLVertexViewerDomElementElement
): RendererElement {
  const position = parsePosition(element);
  const quaternion = parseRotation(element);
  const scale = parseScale(element);
  return { position, quaternion, scale };
}

function parsePosition(
  element: HTMLVertexViewerDomElementElement
): Vector3.Vector3 {
  return parseProperty(
    'position',
    element.position,
    Vector3.origin(),
    Vector3.fromJson
  );
}

function parseRotation(
  element: HTMLVertexViewerDomElementElement
): Quaternion.Quaternion {
  return parseProperty(
    'rotation',
    element.rotation,
    Quaternion.create(),
    (str) => {
      const obj = JSON.parse(str);
      if (Array.isArray(obj)) {
        const [x, y, z, wOrOrder] = obj;
        if (typeof wOrOrder === 'string') {
          return Quaternion.fromEuler({
            x,
            y,
            z,
            order: wOrOrder as Euler.EulerOrder,
          });
        } else {
          return Quaternion.create({ x, y, z, w: wOrOrder });
        }
      } else {
        const { x, y, z, w, order } = obj;
        if (order != null) {
          return Quaternion.fromEuler({ x, y, z, order });
        } else {
          return Quaternion.create({ x, y, z, w });
        }
      }
    }
  ) as Quaternion.Quaternion;
}

function parseScale(
  element: HTMLVertexViewerDomElementElement
): Vector3.Vector3 {
  return parseProperty(
    'scale',
    element.scale,
    Vector3.create(1, 1, 1),
    Vector3.fromJson
  );
}

function parseProperty<T>(
  propName: string,
  value: T | string,
  defaultValue: T,
  f: (value: string) => T
): T {
  if (typeof value === 'string') {
    try {
      return f(value);
    } catch (e) {
      console.warn(
        `<vertex-viewer-dom-renderer> could not parse element property ${propName}.`
      );
      return defaultValue;
    }
  } else {
    return value;
  }
}
