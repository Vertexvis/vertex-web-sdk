import {
  Color,
  Mesh,
  MeshPhongMaterial,
  Scene,
  Matrix4 as Mat4,
  Vector3 as Vec3,
  FrontSide,
  Group,
  Box3,
} from 'three';
import { AffineMatrix4f } from '@vertexvis/flex-time-protos/dist/core/protos/geometry';
import { VertexThreeJsGeometry } from './geometry';
import { FlexTimeApi } from '../flexApi';
import { GetGeometryResponse } from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/flex_time_api';
import { RenderItem } from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/domain';

export class VertexScene extends Scene {
  public constructor(
    private readonly client: FlexTimeApi,
    private readonly sceneId: string
  ) {
    super();
  }

  public async loadSceneItem(viewId: string, itemId: string): Promise<Group> {
    const call = this.client.getSceneItemGeometry(this.sceneId, viewId, itemId);
    const group = new Group();
    const bbox = new Box3();
    for await (const res of call.responses) {
      const box = this.handleGeometryResponse(group, res);
      bbox.union(box);
    }
    this.add(group);
    // this.positionChildren(group, bbox);
    return group;
  }

  private positionChildren(group: Group, bbox: Box3): void {
    const center = bbox.getCenter(new Vec3());
    for (const child of group.children) {
      child.position.sub(center);
    }
    group.position.set(center.x, center.y, center.z);
  }

  private handleGeometryResponse(group: Group, res: GetGeometryResponse): Box3 {
    console.log('received geometry', res);

    const bbox = new Box3();
    for (const item of res.items) {
      const mesh = this.addMesh(item);
      group.add(mesh);
      mesh.geometry.computeBoundingBox();

      if (mesh.geometry.boundingBox) {
        bbox.union(mesh.geometry.boundingBox);
      }
    }
    return bbox;
  }

  private addMesh(item: RenderItem): Mesh {
    const { material, transform, triangleSet } = item;

    const mat = new MeshPhongMaterial({
      color: new Color(material!.kd!.r, material!.kd!.g, material!.kd!.b),
      emissive: new Color(material!.ke!.r, material!.ke!.g, material!.ke!.b),
      // specular: new THREE.Color(material.ks.r, material.ks.g, material.ks.b),
      shininess: material!.ns,
      reflectivity: 0,
      side: FrontSide,
      // flatShading: true,
      // wireframe: true,
      // wireframeLinewidth: 2,
    });

    const geometry = VertexThreeJsGeometry.fromProto(triangleSet!);
    const mesh = new Mesh(geometry, mat);
    mesh.applyMatrix4(createMat4FromAffine(transform!));
    return mesh;
  }
}

function createMat4FromAffine(affine: AffineMatrix4f): Mat4 {
  const { basisX, basisY, scale, xlate } = affine;

  const x = new Vec3(basisX!.x, basisX!.y, basisX!.z);
  const y = new Vec3(basisY!.x, basisY!.y, basisY!.z);
  const z = x.clone().cross(y);

  const matrix = new Mat4();
  /* eslint-disable prettier/prettier */
  matrix.set(
    x.x * scale, x.y * scale, x.z * scale, xlate!.x,
    y.x * scale, y.y * scale, y.z * scale, xlate!.y,
    z.x * scale, z.y * scale, z.z * scale, xlate!.z,
    0, 0, 0, 1
  );
  /* eslint-enable prettier/prettier */

  return matrix;
}
