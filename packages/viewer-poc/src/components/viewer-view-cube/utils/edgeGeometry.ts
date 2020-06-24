import { BufferAttribute, Geometry, Vector3 } from 'zen-3d';

abstract class ConfigurableCubeGeometry extends Geometry {
  protected numberOfVertices = 0;
  protected groupStart = 0;
  protected indices: number[] = [];
  protected vertices: number[] = [];
  protected normals: number[] = [];
  protected uvs: number[] = [];

  public constructor(
    protected width = 1,
    protected height = 1,
    protected depth = 1,
    protected widthSegments = 1,
    protected heightSegments = 1,
    protected depthSegments = 1
  ) {
    super();
    this.widthSegments = Math.floor(this.widthSegments);
    this.heightSegments = Math.floor(this.heightSegments);
    this.depthSegments = Math.floor(this.depthSegments);
    this.buildGeometry();
  }

  protected buildPlane(
    u: string,
    v: string,
    w: string,
    udir: number,
    vdir: number,
    width: number,
    height: number,
    depth: number,
    gridX: number,
    gridY: number,
    materialIndex: number
  ): void {
    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;

    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const depthHalf = depth / 2;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    let vertexCounter = 0;
    let groupCount = 0;

    let ix, iy;

    const vector = new Vector3();

    // generate vertices, normals and uvs

    for (iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;

      for (ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;

        // set values to correct vector component

        vector[u] = x * udir;
        vector[v] = y * vdir;
        vector[w] = depthHalf;

        // now apply vector to vertex buffer

        this.vertices.push(vector.x, vector.y, vector.z);

        // set values to correct vector component

        vector[u] = 0;
        vector[v] = 0;
        vector[w] = depth > 0 ? 1 : -1;

        // now apply vector to normal buffer

        this.normals.push(vector.x, vector.y, vector.z);

        // uvs

        this.uvs.push(ix / gridX);
        this.uvs.push(1 - iy / gridY);

        // counters

        vertexCounter += 1;
      }
    }

    // indices

    // 1. you need three indices to draw a single face
    // 2. a single segment consists of two faces
    // 3. so we need to generate six (2*3) indices per segment

    for (iy = 0; iy < gridY; iy++) {
      for (ix = 0; ix < gridX; ix++) {
        const a = this.numberOfVertices + ix + gridX1 * iy;
        const b = this.numberOfVertices + ix + gridX1 * (iy + 1);
        const c = this.numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
        const d = this.numberOfVertices + (ix + 1) + gridX1 * iy;

        // faces

        this.indices.push(a, b, d);
        this.indices.push(b, c, d);

        // increase counter

        groupCount += 6;
      }
    }

    // add a group to the geometry. this will ensure multi material support
    super.addGroup(this.groupStart, groupCount, materialIndex);

    // calculate new start value for groups
    this.groupStart += groupCount;

    // update total number of vertices
    this.numberOfVertices += vertexCounter;
  }

  protected buildGeometry(): void {
    this.definePlanes();

    // build geometry
    super.setIndex(this.indices);
    super.addAttribute(
      'a_Position',
      new BufferAttribute(new Float32Array(this.vertices), 3)
    );
    super.addAttribute(
      'a_Normal',
      new BufferAttribute(new Float32Array(this.normals), 3)
    );
    super.addAttribute(
      'a_Uv',
      new BufferAttribute(new Float32Array(this.uvs), 2)
    );

    super.computeBoundingBox();
    super.computeBoundingSphere();
  }

  protected abstract definePlanes(): void;
}

export class EdgeGeometry extends ConfigurableCubeGeometry {
  protected definePlanes(): void {
    this.buildPlane(
      'x',
      'z',
      'y',
      1,
      1,
      this.width,
      this.depth,
      this.height,
      this.widthSegments,
      this.depthSegments,
      0
    ); // py
    this.buildPlane(
      'x',
      'y',
      'z',
      1,
      -1,
      this.width,
      this.height,
      this.depth,
      this.widthSegments,
      this.heightSegments,
      1
    ); // pz
  }
}

export class CornerGeometry extends ConfigurableCubeGeometry {
  protected definePlanes(): void {
    this.buildPlane(
      'z',
      'y',
      'x',
      1,
      -1,
      this.depth,
      this.height,
      -this.width,
      this.depthSegments,
      this.heightSegments,
      0
    ); // nx
    this.buildPlane(
      'x',
      'z',
      'y',
      1,
      1,
      this.width,
      this.depth,
      this.height,
      this.widthSegments,
      this.depthSegments,
      1
    ); // py
    this.buildPlane(
      'x',
      'y',
      'z',
      1,
      -1,
      this.width,
      this.height,
      this.depth,
      this.widthSegments,
      this.heightSegments,
      2
    ); // pz
  }
}
