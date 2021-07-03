import { Vector3 } from '@vertexvis/geometry';
import { Indexed3DTriangleSet as Indexed3DTriangleSetProto } from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/domain';
import { BufferAttribute, BufferGeometry } from 'three';

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
  ) {}

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
    const timer = 'Construct ThreeJS geometry from ITS';
    console.time(timer);

    const { vertices, compressedNormals } = proto;
    const normals = compressedNormals!.oct32S.map((bits) =>
      Oct32Vector.fromBits(bits).decode()
    );
    const geometrySet = new Indexed3DGeometrySet(
      vertices!.values,
      vertices!.indices,
      normals
    );

    console.timeEnd(timer);
    return geometrySet;
  }
}

export class VertexThreeJsGeometry extends BufferGeometry {
  public constructor(geometrySet: Indexed3DGeometrySet) {
    super();

    const p = new Float32Array(geometrySet.vertexIndices.length * 3);
    for (let i = 0; i < geometrySet.vertexIndices.length; i++) {
      const index = geometrySet.vertexIndices[i];
      const vertex = geometrySet.vertices[index];
      const offset = i * 3;
      p[offset + 0] = vertex.x;
      p[offset + 1] = vertex.y;
      p[offset + 2] = vertex.z;
    }
    const positions = new BufferAttribute(p, 3);

    const n = new Float32Array(geometrySet.normals.length * 3);
    for (let i = 0; i < geometrySet.normals.length; i++) {
      const normal = geometrySet.normals[i];
      const offset = i * 3;
      n[offset + 0] = normal.x;
      n[offset + 1] = normal.y;
      n[offset + 2] = normal.z;
    }

    const normals = new BufferAttribute(n, 3);

    this.setAttribute('position', positions);
    this.setAttribute('normal', normals);
  }

  public static fromProto(
    proto: Indexed3DTriangleSetProto
  ): VertexThreeJsGeometry {
    const data = Indexed3DGeometrySet.fromProto(proto);
    return new VertexThreeJsGeometry(data);
  }
}
