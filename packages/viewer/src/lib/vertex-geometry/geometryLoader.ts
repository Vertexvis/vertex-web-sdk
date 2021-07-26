import {
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshPhongMaterial,
  Matrix4 as Mat4,
  Vector3 as Vec3,
  Material,
} from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { AffineMatrix4f } from '@vertexvis/flex-time-protos/dist/core/protos/geometry';
import { ColorMaterialf } from '@vertexvis/flex-time-protos/dist/core/protos/material';
import {
  GetCompressedGeometryResponse,
  GetGeometryResponse,
} from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/flex_time_api';
import {
  CompressedRenderItem,
  RenderItem,
} from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/domain';
import { FlexTimeApi } from './flexApi';
import { isCompressedRenderItem } from './typeGuards';
import {
  makeGeometryFromCompressedRenderItem,
  makeGeometryFromRenderItem,
  makeIndexedGeometryFromRenderItem,
} from './geometry';

export interface VertexGeometryLoaderOptions {
  compressed?: boolean;
  workerLimit?: number;
}

export class VertexGeometryLoader {
  private readonly options: Required<VertexGeometryLoaderOptions>;
  private readonly dracoLoader: DRACOLoader;

  public constructor(
    private readonly client: FlexTimeApi,
    options: VertexGeometryLoaderOptions = {}
  ) {
    this.options = {
      compressed: options.compressed ?? false,
      workerLimit: options.workerLimit ?? window.navigator.hardwareConcurrency,
    };

    this.dracoLoader = new DRACOLoader();
    if (this.options.compressed) {
      this.dracoLoader.setWorkerLimit(this.options.workerLimit);
      this.dracoLoader.setDecoderPath(
        'https://www.gstatic.com/draco/versioned/decoders/1.4.1/'
      );
      this.dracoLoader.preload();
    }
  }

  public async load(
    sceneId: string,
    sceneViewId: string,
    sceneItemId: string
  ): Promise<Group> {
    const req = { sceneId, sceneViewId, sceneItemId };
    const call = this.options.compressed
      ? this.client.getCompressedSceneGeometry(req)
      : this.client.getSceneGeometry(req);

    const group = new Group();
    for await (const res of call.responses) {
      // There could be a perf improvement here if this didn't block processing
      // incoming responses.
      const meshes = await Promise.all(this.makeMeshesFromResponse(res));
      for (const mesh of meshes) {
        group.add(mesh);
      }
    }
    return group;
  }

  private makeMeshesFromResponse(
    res: GetGeometryResponse | GetCompressedGeometryResponse
  ): Promise<Mesh>[] {
    return res.items.map((item: RenderItem | CompressedRenderItem) =>
      this.makeMesh(item)
    );
  }

  private async makeMesh(
    item: RenderItem | CompressedRenderItem
  ): Promise<Mesh> {
    const mat = makeMaterialFromRenderItem(item.material!);
    const geometry = await (isCompressedRenderItem(item)
      ? makeGeometryFromCompressedRenderItem(item, this.dracoLoader)
      : makeGeometryFromRenderItem(item));

    const mesh = new Mesh(geometry, mat);
    mesh.applyMatrix4(makeMat4FromAffine(item.transform!));
    return mesh;
  }
}

function makeMaterialFromRenderItem(material: ColorMaterialf): Material {
  return new MeshPhongMaterial({
    color: new Color(material.kd!.r, material.kd!.g, material.kd!.b),
    emissive: new Color(material.ke!.r, material.ke!.g, material.ke!.b),
    // specular: new THREE.Color(material.ks.r, material.ks.g, material.ks.b),
    shininess: material.ns,
    reflectivity: 0,
    side: FrontSide,
    // flatShading: true,
    // wireframe: true,
    // wireframeLinewidth: 2,
  });
}

function makeMat4FromAffine(affine: AffineMatrix4f): Mat4 {
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
