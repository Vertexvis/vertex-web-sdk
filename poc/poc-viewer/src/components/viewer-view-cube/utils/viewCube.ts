import {
  BasicMaterial,
  Box3,
  Camera as ZenCamera,
  Color3,
  Group,
  Mesh,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  DRAW_SIDE,
  HitResult,
  Object3D,
  Material,
  OBJECT_TYPE,
} from 'zen-3d';
import { GLTFLoader, Loader } from './loader';
import { Angle, Point, Vector3 } from '@vertexvis/geometry';
import { EdgeGeometry, CornerGeometry } from './edgeGeometry';
import { Camera } from '@vertexvis/poc-graphics-3d';

export class ViewCube extends Group {
  private isLoadingOrLoaded = false;
  private raycaster: Raycaster = new Raycaster();
  private highlightedMesh?: Mesh;

  private frontMesh?: Mesh;
  private backMesh?: Mesh;
  private topMesh?: Mesh;
  private bottomMesh?: Mesh;
  private leftMesh?: Mesh;
  private rightMesh?: Mesh;

  private frontTopMesh?: Mesh;
  private frontBottomMesh?: Mesh;
  private frontLeftMesh?: Mesh;
  private frontRightMesh?: Mesh;

  private backTopMesh?: Mesh;
  private backBottomMesh?: Mesh;
  private backLeftMesh?: Mesh;
  private backRightMesh?: Mesh;

  private topLeftMesh?: Mesh;
  private topRightMesh?: Mesh;

  private bottomLeftMesh?: Mesh;
  private bottomRightMesh?: Mesh;

  private frontTopLeftMesh?: Mesh;
  private frontTopRightMesh?: Mesh;
  private frontBottomLeftMesh?: Mesh;
  private frontBottomRightMesh?: Mesh;

  private backTopLeftMesh?: Mesh;
  private backTopRightMesh?: Mesh;
  private backBottomLeftMesh?: Mesh;
  private backBottomRightMesh?: Mesh;

  private hitToCamera: Map<
    Object3D,
    Pick<Camera.Camera, 'position' | 'upvector'>
  > = new Map();

  public constructor(private assetPath: string) {
    super();
  }

  public async load(loader: Loader = new GLTFLoader()): Promise<void> {
    if (!this.isLoadingOrLoaded) {
      this.isLoadingOrLoaded = true;

      try {
        const gltfModel = await loader.load(this.assetPath);

        gltfModel.scene.children.forEach(child => {
          super.add(child);

          if (
            child.name.toLowerCase() === 'cube' &&
            child.type === OBJECT_TYPE.MESH
          ) {
            const obj = child as Mesh;
            this.createHitTargets(obj.geometry.boundingBox);
          }
        });
      } catch (e) {
        this.isLoadingOrLoaded = false;
        throw new Error(e.toString());
      }
    }
  }

  public getHit(
    point: Point.Point,
    scene: Scene,
    camera: ZenCamera
  ): HitResult | undefined {
    this.raycaster.setFromCamera(new Vector2(point.x, point.y), camera);
    return this.raycaster.intersectObject(scene, true)[0];
  }

  public getHitToCamera(
    point: Point.Point,
    scene: Scene,
    camera: ZenCamera
  ): Pick<Camera.Camera, 'position' | 'upvector'> | undefined {
    const hit = this.getHit(point, scene, camera);
    return this.hitToCamera.get(hit?.object);
  }

  public highlight(
    point: Point.Point,
    scene: Scene,
    camera: ZenCamera
  ): HitResult | undefined {
    if (this.highlightedMesh != null) {
      this.highlightedMesh.material.opacity = 0;
      this.highlightedMesh = null;
    }

    const hit = this.getHit(point, scene, camera);
    if (hit != null && hit.object.type === OBJECT_TYPE.MESH) {
      const obj = hit.object as Mesh;
      obj.material.opacity = 0.2;
      this.highlightedMesh = obj;
      return hit;
    }
  }

  private createHitTargets(boundingBox: Box3): void {
    // Adds distance between the cube and a hit target. Prevents problems where
    // the hit target and cube have the same depth and the cube becomes a hit
    // target.
    const offset = 0.0001;

    // The length of an edge for a hit target.
    const edgeLength = 0.35;

    const xLength = boundingBox.max.x - boundingBox.min.x;
    const yLength = boundingBox.max.y - boundingBox.min.y;

    const frontEdge = boundingBox.max.z - edgeLength / 2 + offset;
    const backEdge = boundingBox.min.z + edgeLength / 2 - offset;
    const leftEdge = boundingBox.min.x + edgeLength / 2 - offset;
    const rightEdge = boundingBox.max.x - edgeLength / 2 + offset;
    const topEdge = boundingBox.max.y - edgeLength / 2 + offset;
    const bottomEdge = boundingBox.min.y + edgeLength / 2 - offset;

    const sidePlane = new PlaneGeometry(xLength - 0.7, yLength - 0.7);
    const edge = new EdgeGeometry(xLength - 0.7, edgeLength, edgeLength);
    const corner = new CornerGeometry(edgeLength, edgeLength, edgeLength);

    // front
    this.frontMesh = new Mesh(sidePlane, this.createHitMaterial());
    this.frontMesh.position.set(0, 0, boundingBox.max.z + offset);
    this.frontMesh.euler.x = Angle.toRadians(90);
    this.hitToCamera.set(this.frontMesh, {
      position: Vector3.back(),
      upvector: Vector3.up(),
    });
    super.add(this.frontMesh);

    // back
    this.backMesh = new Mesh(sidePlane, this.createHitMaterial());
    this.backMesh.position.set(0, 0, boundingBox.min.z - offset);
    this.backMesh.euler.x = Angle.toRadians(90);
    this.hitToCamera.set(this.backMesh, {
      position: Vector3.forward(),
      upvector: Vector3.up(),
    });
    super.add(this.backMesh);

    // left
    this.leftMesh = new Mesh(sidePlane, this.createHitMaterial());
    this.leftMesh.position.set(boundingBox.min.x - offset, 0, 0);
    this.leftMesh.euler.z = Angle.toRadians(90);
    this.hitToCamera.set(this.leftMesh, {
      position: Vector3.left(),
      upvector: Vector3.up(),
    });
    super.add(this.leftMesh);

    // right
    this.rightMesh = new Mesh(sidePlane, this.createHitMaterial());
    this.rightMesh.position.set(boundingBox.max.x + offset, 0, 0);
    this.rightMesh.euler.z = Angle.toRadians(90);
    this.hitToCamera.set(this.rightMesh, {
      position: Vector3.right(),
      upvector: Vector3.up(),
    });
    super.add(this.rightMesh);

    // top
    this.topMesh = new Mesh(sidePlane, this.createHitMaterial());
    this.topMesh.position.set(0, boundingBox.max.y + offset, 0);
    this.hitToCamera.set(this.topMesh, {
      position: Vector3.up(),
      upvector: Vector3.forward(),
    });
    super.add(this.topMesh);

    // bottom
    this.bottomMesh = new Mesh(sidePlane, this.createHitMaterial());
    this.bottomMesh.position.set(0, boundingBox.min.y - offset, 0);
    this.hitToCamera.set(this.bottomMesh, {
      position: Vector3.down(),
      upvector: Vector3.back(),
    });
    super.add(this.bottomMesh);

    // front-top
    this.frontTopMesh = new Mesh(edge, this.createHitMaterial());
    this.frontTopMesh.position.set(0, topEdge, frontEdge);
    this.hitToCamera.set(this.frontTopMesh, {
      position: Vector3.add(Vector3.back(), Vector3.up()),
      upvector: Vector3.up(),
    });
    super.add(this.frontTopMesh);

    // front-bottom
    this.frontBottomMesh = new Mesh(edge, this.createHitMaterial());
    this.frontBottomMesh.position.set(0, bottomEdge, frontEdge);
    this.frontBottomMesh.euler.x = Angle.toRadians(90);
    this.hitToCamera.set(this.frontBottomMesh, {
      position: Vector3.add(Vector3.back(), Vector3.down()),
      upvector: Vector3.up(),
    });
    super.add(this.frontBottomMesh);

    // front-left
    this.frontLeftMesh = new Mesh(edge, this.createHitMaterial());
    this.frontLeftMesh.position.set(leftEdge, 0, frontEdge);
    this.frontLeftMesh.euler.z = Angle.toRadians(90);
    this.hitToCamera.set(this.frontLeftMesh, {
      position: Vector3.add(Vector3.back(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.frontLeftMesh);

    // front-right
    this.frontRightMesh = new Mesh(edge, this.createHitMaterial());
    this.frontRightMesh.position.set(rightEdge, 0, frontEdge);
    this.frontRightMesh.euler.z = Angle.toRadians(-90);
    this.hitToCamera.set(this.frontRightMesh, {
      position: Vector3.add(Vector3.back(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.frontRightMesh);

    // back-top
    this.backTopMesh = new Mesh(edge, this.createHitMaterial());
    this.backTopMesh.position.set(0, topEdge, backEdge);
    this.backTopMesh.euler.x = Angle.toRadians(-90);
    this.hitToCamera.set(this.backTopMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.up()),
      upvector: Vector3.up(),
    });
    super.add(this.backTopMesh);

    // back-bottom
    this.backBottomMesh = new Mesh(edge, this.createHitMaterial());
    this.backBottomMesh.position.set(0, bottomEdge, backEdge);
    this.backBottomMesh.euler.x = Angle.toRadians(180);
    this.hitToCamera.set(this.backBottomMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.down()),
      upvector: Vector3.up(),
    });
    super.add(this.backBottomMesh);

    // back-left
    this.backLeftMesh = new Mesh(edge, this.createHitMaterial());
    this.backLeftMesh.position.set(leftEdge, 0, backEdge);
    this.backLeftMesh.euler.y = Angle.toRadians(270);
    this.backLeftMesh.euler.z = Angle.toRadians(90);
    this.hitToCamera.set(this.backLeftMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.backLeftMesh);

    // back-right
    this.backRightMesh = new Mesh(edge, this.createHitMaterial());
    this.backRightMesh.position.set(rightEdge, 0, backEdge);
    this.backRightMesh.euler.y = Angle.toRadians(180);
    this.backRightMesh.euler.z = Angle.toRadians(90);
    this.hitToCamera.set(this.backRightMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.backRightMesh);

    // top-left
    this.topLeftMesh = new Mesh(edge, this.createHitMaterial());
    this.topLeftMesh.position.set(leftEdge, topEdge, 0);
    this.topLeftMesh.euler.y = Angle.toRadians(-90);
    this.hitToCamera.set(this.topLeftMesh, {
      position: Vector3.add(Vector3.up(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.topLeftMesh);

    // top-right
    this.topRightMesh = new Mesh(edge, this.createHitMaterial());
    this.topRightMesh.position.set(rightEdge, topEdge, 0);
    this.topRightMesh.euler.y = Angle.toRadians(90);
    this.hitToCamera.set(this.topRightMesh, {
      position: Vector3.add(Vector3.up(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.topRightMesh);

    // bottom-left
    this.bottomLeftMesh = new Mesh(edge, this.createHitMaterial());
    this.bottomLeftMesh.position.set(leftEdge, bottomEdge, 0);
    this.bottomLeftMesh.euler.x = Angle.toRadians(90);
    this.bottomLeftMesh.euler.z = Angle.toRadians(90);
    this.hitToCamera.set(this.bottomLeftMesh, {
      position: Vector3.add(Vector3.down(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.bottomLeftMesh);

    // bottom-right
    this.bottomRightMesh = new Mesh(edge, this.createHitMaterial());
    this.bottomRightMesh.position.set(rightEdge, bottomEdge, 0);
    this.bottomRightMesh.euler.x = Angle.toRadians(90);
    this.bottomRightMesh.euler.z = Angle.toRadians(-90);
    this.hitToCamera.set(this.bottomRightMesh, {
      position: Vector3.add(Vector3.down(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.bottomRightMesh);

    // front-top-left
    this.frontTopLeftMesh = new Mesh(corner, this.createHitMaterial());
    this.frontTopLeftMesh.position.set(leftEdge, topEdge, frontEdge);
    this.hitToCamera.set(this.frontTopLeftMesh, {
      position: Vector3.add(Vector3.back(), Vector3.up(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.frontTopLeftMesh);

    // front-top-right
    this.frontTopRightMesh = new Mesh(corner, this.createHitMaterial());
    this.frontTopRightMesh.position.set(rightEdge, topEdge, frontEdge);
    this.frontTopRightMesh.euler.y = Angle.toRadians(90);
    this.hitToCamera.set(this.frontTopRightMesh, {
      position: Vector3.add(Vector3.back(), Vector3.up(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.frontTopRightMesh);

    // front-bottom-left
    this.frontBottomLeftMesh = new Mesh(corner, this.createHitMaterial());
    this.frontBottomLeftMesh.position.set(leftEdge, bottomEdge, frontEdge);
    this.frontBottomLeftMesh.euler.x = Angle.toRadians(180);
    this.frontBottomLeftMesh.euler.y = Angle.toRadians(-90);
    this.hitToCamera.set(this.frontBottomLeftMesh, {
      position: Vector3.add(Vector3.back(), Vector3.down(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.frontBottomLeftMesh);

    // front-bottom-right
    this.frontBottomRightMesh = new Mesh(corner, this.createHitMaterial());
    this.frontBottomRightMesh.position.set(rightEdge, bottomEdge, frontEdge);
    this.frontBottomRightMesh.euler.x = Angle.toRadians(180);
    this.frontBottomRightMesh.euler.y = Angle.toRadians(180);
    this.hitToCamera.set(this.frontBottomRightMesh, {
      position: Vector3.add(Vector3.back(), Vector3.down(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.frontBottomRightMesh);

    // back-top-left
    this.backTopLeftMesh = new Mesh(corner, this.createHitMaterial());
    this.backTopLeftMesh.position.set(leftEdge, topEdge, backEdge);
    this.backTopLeftMesh.euler.y = Angle.toRadians(-90);
    this.hitToCamera.set(this.backTopLeftMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.up(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.backTopLeftMesh);

    // back-top-right
    this.backTopRightMesh = new Mesh(corner, this.createHitMaterial());
    this.backTopRightMesh.position.set(rightEdge, topEdge, backEdge);
    this.backTopRightMesh.euler.y = Angle.toRadians(180);
    this.hitToCamera.set(this.backTopRightMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.up(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.backTopRightMesh);

    // back-bottom-left
    this.backBottomLeftMesh = new Mesh(corner, this.createHitMaterial());
    this.backBottomLeftMesh.position.set(leftEdge, bottomEdge, backEdge);
    this.backBottomLeftMesh.euler.x = Angle.toRadians(180);
    this.hitToCamera.set(this.backBottomLeftMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.down(), Vector3.left()),
      upvector: Vector3.up(),
    });
    super.add(this.backBottomLeftMesh);

    // back-bottom-right
    this.backBottomRightMesh = new Mesh(corner, this.createHitMaterial());
    this.backBottomRightMesh.position.set(rightEdge, bottomEdge, backEdge);
    this.backBottomRightMesh.euler.x = Angle.toRadians(-90);
    this.backBottomRightMesh.euler.y = Angle.toRadians(180);
    this.hitToCamera.set(this.backBottomRightMesh, {
      position: Vector3.add(Vector3.forward(), Vector3.down(), Vector3.right()),
      upvector: Vector3.up(),
    });
    super.add(this.backBottomRightMesh);
  }

  private createHitMaterial(): Material {
    const material = new BasicMaterial();
    material.diffuse = new Color3(0x0099cc);
    material.transparent = true;
    material.opacity = 0;
    material.side = DRAW_SIDE.DOUBLE;
    return material;
  }
}
