import { Vector3 } from '@vertexvis/geometry';
import {
  CompressedRenderItem,
  Indexed3DTriangleSet as Indexed3DTriangleSetProto,
  RenderItem,
} from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/domain';
import { BufferAttribute, BufferGeometry } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const NORMAL_16_NUM_BITS = 16;
const NORMAL_16_MAX_VALUE = (1 << (NORMAL_16_NUM_BITS - 1)) - 1;

class Normal16 {
  public constructor(private readonly bits: number) {}

  public decode(): number {
    return this.bits * (1 / NORMAL_16_MAX_VALUE);
  }
}

class Oct32Vector {
  public constructor(
    public readonly uu: Normal16,
    public readonly vv: Normal16
  ) {}

  public static fromBits(bits: number): Oct32Vector {
    const uu = new Normal16(bits >> 16);
    const vv = new Normal16(((bits & 0xffff) << 16) >> 16);
    return new Oct32Vector(uu, vv);
  }

  public decode(): Vector3.Vector3 {
    let xx = this.uu.decode();
    let yy = this.vv.decode();

    const zz = 1 - (Math.abs(xx) + Math.abs(yy));
    if (zz < 0) {
      const oldX = xx;
      xx = (1 - Math.abs(yy)) * this.sign0(oldX);
      yy = (1 - Math.abs(oldX)) * this.sign0(yy);
    }

    return Vector3.normalize({ x: xx, y: yy, z: zz });
  }

  private sign0(f: number): number {
    return f < 0 ? -1 : 1;
  }
}

export class Indexed3DGeometrySet {
  public constructor(
    public readonly vertices: Vector3.Vector3[],
    public readonly vertexIndices: number[],
    public readonly normals: Vector3.Vector3[]
  ) {
    console.log('vertices count', vertices.length);
    console.log('indices length', vertexIndices.length);
    console.log('normals length', normals.length);
  }

  public static fromJson(json: any): Indexed3DGeometrySet {
    const {
      def: { vertices, compressedNormals },
    } = json;

    const normals = compressedNormals.oct32s.map((bits: any) =>
      Oct32Vector.fromBits(bits).decode()
    );
    return new Indexed3DGeometrySet(vertices.values, vertices.indices, normals);
  }

  public static fromProto(
    proto: Indexed3DTriangleSetProto
  ): Indexed3DGeometrySet {
    const { vertices, compressedNormals } = proto;
    const normals = compressedNormals!.oct32S.map((bits) =>
      Oct32Vector.fromBits(bits).decode()
    );
    const geometrySet = new Indexed3DGeometrySet(
      vertices!.values,
      vertices!.indices,
      normals
    );

    return geometrySet;
  }
}

export function makeGeometryFromRenderItem(item: RenderItem): BufferGeometry {
  const json = JSON.stringify(item, undefined, '');
  window.navigator.clipboard
    .writeText(json)
    .then(() => console.log('copied to clipboard'));

  if (item.triangleSet != null) {
    const timer = 'Construct ThreeJS geometry from RenderItem';
    console.time(timer);

    const its = Indexed3DGeometrySet.fromProto(item.triangleSet);
    const geometry = new BufferGeometry();

    const p = new Float32Array(its.vertexIndices.length * 3);
    for (let i = 0; i < its.vertexIndices.length; i++) {
      const index = its.vertexIndices[i];
      const vertex = its.vertices[index];
      const offset = i * 3;
      p[offset + 0] = vertex.x;
      p[offset + 1] = vertex.y;
      p[offset + 2] = vertex.z;
    }
    const positions = new BufferAttribute(p, 3);

    const n = new Float32Array(its.normals.length * 3);
    for (let i = 0; i < its.normals.length; i++) {
      const normal = its.normals[i];
      const offset = i * 3;
      n[offset + 0] = normal.x;
      n[offset + 1] = normal.y;
      n[offset + 2] = normal.z;
    }

    const normals = new BufferAttribute(n, 3);

    geometry.setAttribute('position', positions);
    geometry.setAttribute('normal', normals);

    console.log('Created ThreeJS geometry', geometry);

    console.timeEnd(timer);

    return geometry;
  } else throw new Error('Missing indexed triangle set.');
}

// Attempt to infer an index from the geometry that's returned. Note: currently
// doesn't work :)
export function makeIndexedGeometryFromRenderItem(
  item: RenderItem
): BufferGeometry {
  if (item.triangleSet != null) {
    const timer = 'Construct ThreeJS geometry from RenderItem';
    console.time(timer);

    const its = Indexed3DGeometrySet.fromProto(item.triangleSet);
    const geometry = new BufferGeometry();

    const p = new Float32Array(its.vertices.length * 3);
    for (let i = 0; i < its.vertices.length; i++) {
      const vertex = its.vertices[i];
      const offset = i * 3;
      p[offset + 0] = vertex.x;
      p[offset + 1] = vertex.y;
      p[offset + 2] = vertex.z;
    }
    const positions = new BufferAttribute(p, 3);

    const n = new Float32Array(its.vertices.length * 3);
    for (let i = 0; i < its.vertexIndices.length; i++) {
      const index = its.vertexIndices[i];
      const normal = its.normals[i];
      const offset = index * 3;
      n[offset + 0] = normal.x;
      n[offset + 1] = normal.y;
      n[offset + 2] = normal.z;
    }
    const normals = new BufferAttribute(n, 3);

    geometry.setIndex(its.vertexIndices);
    geometry.setAttribute('position', positions);
    geometry.setAttribute('normal', normals);

    console.log('Created ThreeJS geometry', geometry);

    console.timeEnd(timer);

    return geometry;
  } else throw new Error('Missing indexed triangle set.');
}

export async function makeGeometryFromCompressedRenderItem(
  proto: CompressedRenderItem,
  loader: DRACOLoader
): Promise<BufferGeometry> {
  const bytes = proto.dracoBytes?.value;
  if (bytes != null) {
    const geometry = await new Promise<BufferGeometry>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (loader as any).decodeDracoFile(bytes.buffer, resolve);
    });
    // console.log('Created ThreeJS geometry', geometry);

    return geometry;
  } else throw new Error('Draco bytes are undefined.');
}
