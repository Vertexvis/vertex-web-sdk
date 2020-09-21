declare module 'zen-3d' {
  // CORE

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */

  export class EventDispatcher {}

  export class Raycaster {
    public constructor(
      origin?: Vector3,
      direction?: Vector3,
      near?: number,
      far?: number
    );

    public set(origin: Vector3, direction: Vector3): void;

    public setFromCamera(
      point: Vector2,
      camera: Camera,
      cameraType?: 'perspective' | 'orthographic'
    ): void;

    public intersectObject(object: Object3D, recursive?: boolean): HitResult[];

    public intersectObjects(
      object: Object3D[],
      recursive?: boolean
    ): HitResult[];
  }

  class HitResult {
    public object: Object3D;
  }

  // CONSTANT TYPES

  export enum OBJECT_TYPE {
    MESH = 'mesh',
    SKINNED_MESH = 'skinned_mesh',
    LIGHT = 'light',
    CAMERA = 'camera',
    SCENE = 'scene',
    GROUP = 'group',
    CANVAS2D = 'canvas2d',
  }

  export enum LIGHT_TYPE {
    AMBIENT = 'ambient',
    DIRECT = 'direct',
    POINT = 'point',
    SPOT = 'spot',
  }

  export enum MATERIAL_TYPE {
    BASIC = 'basic',
    LAMBERT = 'lambert',
    PHONG = 'phong',
    PBR = 'pbr',
    PBR2 = 'pbr2',
    POINT = 'point',
    LINE = 'line',
    CANVAS2D = 'canvas2d',
    SHADER = 'shader',
    DEPTH = 'depth',
    DISTANCE = 'distance',
  }

  export enum FOG_TYPE {
    NORMAL = 'normal',
    EXP2 = 'exp2',
  }

  export enum BLEND_TYPE {
    NONE = 'none',
    NORMAL = 'normal',
    ADD = 'add',
    CUSTOM = 'custom',
  }

  export enum BLEND_EQUATION {
    DD = 0x8006,
    SUBTRACT = 0x800a,
    REVERSE_SUBTRACT = 0x800b,
  }

  export enum BLEND_FACTOR {
    ZERO = 0,
    ONE = 1,
    SRC_COLOR = 0x0300,
    ONE_MINUS_SRC_COLOR = 0x0301,
    SRC_ALPHA = 0x0302,
    ONE_MINUS_SRC_ALPHA = 0x0303,
    DST_ALPHA = 0x0304,
    ONE_MINUS_DST_ALPHA = 0x0305,
    DST_COLOR = 0x0306,
    ONE_MINUS_DST_COLOR = 0x0307,
  }

  export enum CULL_FACE_TYPE {
    NONE = 'none',
    FRONT = 'front',
    BACK = 'back',
    FRONT_AND_BACK = 'front_and_back',
  }

  export enum DRAW_SIDE {
    FRONT = 'front',
    BACK = 'back',
    DOUBLE = 'double',
  }

  export enum SHADING_TYPE {
    SMOOTH_SHADING = 'smooth_shading',
    FLAT_SHADING = 'flat_shading',
  }

  export enum WEBGL_TEXTURE_TYPE {
    TEXTURE_2D = 0x0de1,
    TEXTURE_CUBE_MAP = 0x8513,
    TEXTURE_3D = 0x806f,
  }

  export enum WEBGL_PIXEL_FORMAT {
    DEPTH_COMPONENT = 0x1902,
    DEPTH_STENCIL = 0x84f9,
    ALPHA = 0x1906,
    RED = 0x1903, // webgl2
    RGB = 0x1907,
    RGBA = 0x1908,
    LUMINANCE = 0x1909,
    LUMINANCE_ALPHA = 0x190a,
    // only for internal formats
    R8 = 0x8229, // webgl2
    RGBA8 = 0x8058,
    RGBA16F = 0x881a,
    RGBA32F = 0x8814,
    DEPTH_COMPONENT16 = 0x81a5,
    DEPTH_COMPONENT24 = 0x81a6,
    DEPTH_COMPONENT32F = 0x8cac,
    DEPTH24_STENCIL8 = 0x88f0,
    DEPTH32F_STENCIL8 = 0x8cad,
  }

  export enum WEBGL_PIXEL_TYPE {
    BYTE = 0x1400,
    UNSIGNED_BYTE = 0x1401,
    SHORT = 0x1402,
    UNSIGNED_SHORT = 0x1403,
    INT = 0x1404,
    UNSIGNED_INT = 0x1405,
    FLOAT = 0x1406,
    HALF_FLOAT = 36193,
    UNSIGNED_INT_24_8 = 0x84fa,
    UNSIGNED_SHORT_4_4_4_4 = 0x8033,
    UNSIGNED_SHORT_5_5_5_1 = 0x8034,
    UNSIGNED_SHORT_5_6_5 = 0x8363,
    FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8dad,
  }

  export enum WEBGL_TEXTURE_FILTER {
    NEAREST = 0x2600,
    LINEAR = 0x2601,
    NEAREST_MIPMAP_NEAREST = 0x2700,
    LINEAR_MIPMAP_NEAREST = 0x2701,
    NEAREST_MIPMAP_LINEAR = 0x2702,
    LINEAR_MIPMAP_LINEAR = 0x2703,
  }

  export enum WEBGL_TEXTURE_WRAP {
    REPEAT = 0x2901,
    CLAMP_TO_EDGE = 0x812f,
    MIRRORED_REPEAT = 0x8370,
  }

  export enum WEBGL_COMPARE_FUNC {
    LEQUAL = 0x0203,
    GEQUAL = 0x0206,
    LESS = 0x0201,
    GREATER = 0x0204,
    EQUAL = 0x0202,
    NOTEQUAL = 0x0205,
    ALWAYS = 0x0207,
    NEVER = 0x0200,
  }

  export enum WEBGL_UNIFORM_TYPE {
    FLOAT_VEC2 = 0x8b50,
    FLOAT_VEC3 = 0x8b51,
    FLOAT_VEC4 = 0x8b52,
    INT_VEC2 = 0x8b53,
    INT_VEC3 = 0x8b54,
    INT_VEC4 = 0x8b55,
    BOOL = 0x8b56,
    BOOL_VEC2 = 0x8b57,
    BOOL_VEC3 = 0x8b58,
    BOOL_VEC4 = 0x8b59,
    FLOAT_MAT2 = 0x8b5a,
    FLOAT_MAT3 = 0x8b5b,
    FLOAT_MAT4 = 0x8b5c,
    SAMPLER_2D = 0x8b5e,
    SAMPLER_2D_SHADOW = 0x8b62,
    SAMPLER_CUBE = 0x8b60,
    SAMPLER_CUBE_SHADOW = 0x8dc5,
    SAMPLER_3D = 0x8b5f,
    BYTE = 0xffff,
    UNSIGNED_BYTE = 0x1401,
    SHORT = 0x1402,
    UNSIGNED_SHORT = 0x1403,
    INT = 0x1404,
    UNSIGNED_INT = 0x1405,
    FLOAT = 0x1406,
  }

  export enum WEBGL_ATTRIBUTE_TYPE {
    FLOAT_VEC2 = 0x8b50,
    FLOAT_VEC3 = 0x8b51,
    FLOAT_VEC4 = 0x8b52,
    FLOAT = 0x1406,
    BYTE = 0xffff,
    UNSIGNED_BYTE = 0x1401,
    UNSIGNED_SHORT = 0x1403,
  }

  export enum SHADOW_TYPE {
    HARD = 'hard',
    POISSON_SOFT = 'poisson_soft',
    PCF3_SOFT = 'pcf3_soft',
    PCF5_SOFT = 'pcf5_soft',
    PCSS16_SOFT = 'pcss16_soft', // webgl2
    PCSS32_SOFT = 'pcss32_soft', // webgl2
    PCSS64_SOFT = 'pcss64_soft', // webgl2
  }

  export enum TEXEL_ENCODING_TYPE {
    LINEAR = 'linear',
    SRGB = 'sRGB',
    RGBE = 'RGBE',
    RGBM7 = 'RGBM7',
    RGBM16 = 'RGBM16',
    RGBD = 'RGBD',
    GAMMA = 'Gamma',
  }

  export enum ENVMAP_COMBINE_TYPE {
    MULTIPLY = 'ENVMAP_BLENDING_MULTIPLY',
    MIX = 'ENVMAP_BLENDING_MIX',
    ADD = 'ENVMAP_BLENDING_ADD',
  }

  export enum DRAW_MODE {
    POINTS = 0,
    LINES = 1,
    LINE_LOOP = 2,
    LINE_STRIP = 3,
    TRIANGLES = 4,
    TRIANGLE_STRIP = 5,
    TRIANGLE_FAN = 6,
  }

  export enum VERTEX_COLOR {
    NONE = 0,
    RGB = 1,
    RGBA = 2,
  }

  export enum ATTACHMENT {
    COLOR_ATTACHMENT0 = 0x8ce0,
    COLOR_ATTACHMENT1 = 0x8ce1,
    COLOR_ATTACHMENT2 = 0x8ce2,
    COLOR_ATTACHMENT3 = 0x8ce3,
    COLOR_ATTACHMENT4 = 0x8ce4,
    COLOR_ATTACHMENT5 = 0x8ce5,
    COLOR_ATTACHMENT6 = 0x8ce6,
    COLOR_ATTACHMENT7 = 0x8ce7,
    COLOR_ATTACHMENT8 = 0x8ce8,
    COLOR_ATTACHMENT9 = 0x8ce9,
    COLOR_ATTACHMENT10 = 0x8ce10,
    COLOR_ATTACHMENT11 = 0x8ce11,
    COLOR_ATTACHMENT12 = 0x8ce12,
    COLOR_ATTACHMENT13 = 0x8ce13,
    COLOR_ATTACHMENT14 = 0x8ce14,
    COLOR_ATTACHMENT15 = 0x8ce15,
    DEPTH_ATTACHMENT = 0x8d00,
    STENCIL_ATTACHMENT = 0x8d20,
    DEPTH_STENCIL_ATTACHMENT = 0x821a,
  }

  export enum DRAW_BUFFER {
    DRAW_BUFFER0 = 0x8825,
    DRAW_BUFFER1 = 0x8826,
    DRAW_BUFFER2 = 0x8827,
    DRAW_BUFFER3 = 0x8828,
    DRAW_BUFFER4 = 0x8829,
    DRAW_BUFFER5 = 0x882a,
    DRAW_BUFFER6 = 0x882b,
    DRAW_BUFFER7 = 0x882c,
    DRAW_BUFFER8 = 0x882d,
    DRAW_BUFFER9 = 0x882e,
    DRAW_BUFFER10 = 0x882f,
    DRAW_BUFFER11 = 0x8830,
    DRAW_BUFFER12 = 0x8831,
    DRAW_BUFFER13 = 0x8832,
    DRAW_BUFFER14 = 0x8833,
    DRAW_BUFFER15 = 0x8834,
  }

  // MATH

  export class Plane {}

  export class Sphere {}

  export type EulerRotationOrder =
    | 'XYZ'
    | 'YZX'
    | 'ZXY'
    | 'XZY'
    | 'YXZ'
    | 'ZYX';

  export class Euler {
    public static RotationOrders: EulerRotationOrder[];
    public static DefaultOrder: EulerRotationOrder;

    public constructor(
      x?: number,
      y?: number,
      z?: number,
      order?: EulerRotationOrder
    );

    public get x(): number;
    public set x(x: number);

    public get y(): number;
    public set y(y: number);

    public get z(): number;
    public set z(z: number);

    public get order(): EulerRotationOrder;
    public set order(o: EulerRotationOrder);

    public copyFrom(e: Euler): Euler;

    public set(
      x?: number,
      y?: number,
      z?: number,
      order?: EulerRotationOrder
    ): Euler;

    public setFromRotationMatrix(
      m: Matrix3 | Matrix4,
      order?: EulerRotationOrder,
      update?: boolean
    ): Euler;

    public setFromQuaternion(
      q: Quaternion,
      order?: EulerRotationOrder,
      update?: boolean
    ): Euler;

    public onChange(c: () => void): Euler;

    public onChangeCallback(): void;
  }

  export class Color3 {
    public constructor(r?: number, g?: number, b?: number);

    public lerpColor(c1: Color3, c2: Color3, ratio: number): void;

    public lerp(c: Color3, ratio: number): void;

    public copy(c: Color3): Color3;

    public setHex(hex: number): Color3;

    public setRGB(r: number, g: number, b: number): Color3;

    public setHSL(h: number, s: number, l: number): Color3;

    public fromArray(arr: number[], offset?: number): Color3;

    public toArray(arr?: number[], offset?: number): number[];
  }

  export class Vector2 {
    public x: number;
    public y: number;

    public constructor(x?: number, y?: number);
  }

  export class Vector3 {
    public x: number;
    public y: number;
    public z: number;

    public constructor(x?: number, y?: number, z?: number);

    public lerpVectors(v1: Vector3, v2: Vector3, ratio: number): Vector3;

    public set(x?: number, y?: number, z?: number): Vector3;

    public min(v: Vector3): Vector3;

    public max(v: Vector3): Vector3;

    public getLength(): number;

    public getLengthSquared(): number;

    public normalize(thickness?: number): Vector3;

    public subtract(v: Vector3, target?: Vector3): Vector3;

    public multiply(v: Vector3): Vector3;

    public crossVectors(a: Vector3, b: Vector3): Vector3;

    public cross(v: Vector3): Vector3;

    public dot(v: Vector3): number;

    public applyQuaternion(q: Quaternion): Vector3;

    public applyMatrix4(m: Matrix4): Vector3;

    public applyMatrix3(m: Matrix3): Vector3;

    public transformDirection(m: Matrix4): Vector3;

    public setFromMatrixPosition(m: Matrix4): Vector3;

    public setFromMatrixColumn(m: Matrix4, index: number): Vector3;

    public fromArray(arr: number[], offset?: number): Vector3;

    public toArray(arr?: number[], offset?: number): number[];

    public copy(v: Vector3): Vector3;

    public addVectors(a: Vector3, b: Vector3): Vector3;

    public addScalar(s: number): Vector3;

    public add(v: Vector3): Vector3;

    public subVectors(a: Vector3, b: Vector3): Vector3;

    public sub(v: Vector3): Vector3;

    public multiplyScalar(s: number): Vector3;

    public distanceToSquared(v: Vector3): number;

    public distanceTo(v: Vector3): number;

    public setFromSpherical(s: Spherical): Vector3;

    public unproject(camera: Camera): Vector3;

    public applyProjection(m: Matrix4): Vector3;

    public equals(v: Vector3): boolean;

    public clone(): Vector3;
  }

  export class Vector4 {}

  export class Quaternion {
    public constructor(x?: number, y?: number, z?: number, w?: number);

    public static slerpFlat(
      dst: number[],
      dstOffset: number,
      src0: number[],
      srcOffset0: number,
      src1: number[],
      srcOffset1: number,
      t: number
    ): void;

    public get x(): number;
    public set x(x: number);

    public get y(): number;
    public set y(y: number);

    public get z(): number;
    public set z(z: number);

    public get w(): number;
    public set w(w: number);

    public normalize(thickness?: number): Quaternion;

    public length(): number;

    public lerpQuaternions(
      q1: Quaternion,
      q2: Quaternion,
      ratio: number
    ): Quaternion;

    public slerpQuaternions(
      q1: Quaternion,
      q2: Quaternion,
      ratio: number
    ): Quaternion;

    public set(x?: number, y?: number, z?: number, w?: number): Quaternion;

    public copy(q: Quaternion): Quaternion;

    public setFromEuler(euler: Euler, update?: boolean): Quaternion;

    public setFromRotationMatrix(m: Matrix3 | Matrix4): Quaternion;

    public setFromUnitVectors(from: Vector3, to: Vector3): Quaternion;

    public multiply(q: Quaternion): Quaternion;

    public premultiply(q: Quaternion): Quaternion;

    public multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion;

    public toMatrix4(m?: Matrix4): Matrix4;

    public dot(q: Quaternion): number;

    public setFromAxisAngle(axis: Vector3, angle: number): Quaternion;

    public fromArray(arr: number[], offset?: number): Quaternion;

    public toArray(arr?: number[], offset?: number): number[];

    public onChange(callback: () => void): Quaternion;

    public onChangeCallback(): void;
  }

  export class Matrix4 {
    public constructor();

    public identity(): Matrix4;

    public set(
      n11: number,
      n12: number,
      n13: number,
      n14: number,
      n21: number,
      n22: number,
      n23: number,
      n24: number,
      n31: number,
      n32: number,
      n33: number,
      n34: number,
      n41: number,
      n42: number,
      n43: number,
      n44: number
    ): Matrix4;

    public copy(m: Matrix4): Matrix4;

    public makeTranslation(x: number, y: number, z: number): Matrix4;

    public multiply(m: Matrix4): Matrix4;

    public premultiply(m: Matrix4): Matrix4;

    public multiplyMatrices(a: Matrix4, b: Matrix4): Matrix4;

    public transpose(): Matrix4;

    public inverse(): Matrix4;

    public getInverse(m: Matrix4): Matrix4;

    public transform(pos: Vector3, scale: Vector3, rot: Quaternion): Matrix4;

    public makeRotationFromQuaternion(q: Quaternion): Matrix4;

    public lookAtRH(eye: Vector3, target: Vector3, up: Vector3): Matrix4;

    public decompose(
      position: Vector3,
      quaternion: Quaternion,
      scale: Vector3
    ): Matrix4;

    public determinant(): Matrix4;

    public fromArray(array: number[], offset?: number): Matrix4;

    public getMaxScaleOnAxis(): number;

    public toArray(arr?: number[], offset?: number): number[];
  }

  export class Matrix3 {
    public constructor();

    public identity(): Matrix3;

    public inverse(): Matrix3;

    public getInverse(m: Matrix3): Matrix3;

    public transpose(): Matrix3;

    public set(
      n11: number,
      n12: number,
      n13: number,
      n21: number,
      n22: number,
      n23: number,
      n31: number,
      n32: number,
      n33: number
    ): Matrix3;

    public copy(m: Matrix3): Matrix3;

    public multiply(m: Matrix3): Matrix3;

    public premultiply(m: Matrix3): Matrix3;

    public multiplyMatrices(a: Matrix3, b: Matrix3): Matrix3;

    public transform(
      tx: number,
      ty: number,
      sx: number,
      sy: number,
      r: number,
      cx: number,
      cy: number
    ): Matrix3;

    public setUvTransform(
      tx: number,
      ty: number,
      sx: number,
      sy: number,
      r: number,
      cx: number,
      cy: number
    ): Matrix3;

    public setFromMatrix4(m: Matrix4): Matrix3;
  }

  export class Spherical {}

  export class Box3 {
    public min: Vector3;

    public max: Vector3;
  }

  // OBJECTS

  export class Object3D {
    public id: number;

    public uuid: string;

    public name: string;

    public type: OBJECT_TYPE;

    public position: Vector3;

    public scale: Vector3;

    public euler: Euler;

    public quaternion: Quaternion;

    public matrix: Matrix4;

    public worldMatrix: Matrix4;

    public children: Object3D[];

    public parent: Object3D;

    public castShadow: boolean;

    public receiveShadow: boolean;

    public shadowType: SHADOW_TYPE;

    public frustumCulled: boolean;

    public visible: boolean;

    public renderOrder: number;

    public userData: Record<string, any>;

    public onBeforeRender: () => void;

    public onAfterRender: () => void;

    public constructor();

    public add(child: Object3D): void;

    public remove(child: Object3D): void;

    public getObjectByName(name: string): Object3D | undefined;

    public getObjectByProperty(prop: string, value: any): Object3D | undefined;

    public updateMatrix(): void;

    /**
     * Returns a vector representing the direction of object's positive z-axis in world space.
     */
    public getWorldDirection(target?: Vector3): Vector3;

    /**
     * Rotates the object to face a point in local space.
     */
    public lookAt(target: Vector3, up?: Vector3): void;

    /**
     * Executes the callback on this object and all descendants.
     */
    public traverse(callback: (child: Object3D) => void): void;

    /**
     * Returns a clone of this object and optionally all descendants.
     */
    public clone(recursive?: boolean): this;

    /**
     * Copy the given object into this object.
     */
    public copy(source: Object3D, recursive?: boolean): this;

    /**
     * Method to get intersections between a casted ray and this object.
     */
    public raycast(raycaster: Raycaster, intersects: number[]): void;
  }

  export class Camera extends Object3D {
    public type: OBJECT_TYPE.CAMERA;

    public viewMatrix: Matrix4;

    public projectionMatrix: Matrix4;

    public fustum: Frustum;

    public gammaFactor: number;

    public gammaInput: boolean;

    public gammaOutput: boolean;

    public rect: Vector4;

    public setOrtho(
      left: number,
      right: number,
      bottom: number,
      top: number,
      near: number,
      far: number
    ): Camera;

    public setPerspective(
      fov: number,
      aspect: number,
      near: number,
      far: number
    ): Camera;
  }

  export class Scene extends Object3D {
    public type: OBJECT_TYPE.SCENE;

    /**
     * If not null, it will force everything in the scene to be rendered with that material.
     * @default null
     */
    public overrideMaterial: Material | null;

    /**
     * A {@link zen3d.Fog} instance defining the type of fog that affects everything rendered in the scene.
     * @default null
     */
    public fog: Fog | null;

    /**
     * User-defined clipping planes specified as {@link zen3d.Plane} objects in world space.
     * These planes apply to the scene.
     * Points in space whose dot product with the plane is negative are cut away.
     * @default []
     */
    public clippingPlanes: Plane[];
  }

  export class Group extends Object3D {
    public type: OBJECT_TYPE.GROUP;
  }

  export class Mesh extends Object3D {
    public type: OBJECT_TYPE.MESH;

    public geometry: Geometry;

    public material: Material;

    public morphTargetInfluences: number[] | null;

    public constructor(geometry: Geometry, material: Material);
  }

  // GEOMETRY

  export class Geometry extends EventDispatcher {
    public id: number;

    public uuid: string;

    public attributes: Record<string, any>;

    public morphAttributes: Record<string, any>;

    public index: BufferAttribute | null;

    public boundingBox: Box3;

    public boundingSphere: Sphere;

    public groups: { start: number; count: number; materialIndex: number }[];

    public addAttribute(name: string, value: any): void;

    public getAttribute(name: string): any;

    public setIndex(index: BufferAttribute | ArrayLike<number>): void;

    public addGroup(start: number, count: number, materialIndex: number): void;

    public clearGroups(): void;

    public computeBoundingBox(): void;

    public computeBoundingSphere(): void;

    public dispose(): void;
  }

  export class PlaneGeometry extends Geometry {
    public constructor(
      width?: number,
      height?: number,
      widthSegments?: number,
      heightSegments?: number
    );
  }

  export class CubeGeometry extends Geometry {
    public constructor(
      width?: number,
      height?: number,
      depth?: number,
      widthSegments?: number,
      heightSegments?: number,
      depthSegments?: number
    );
  }

  export class BufferAttribute {
    public constructor(
      array: ArrayLike<number>,
      size?: number,
      normalized?: boolean
    );
  }

  // MATERIALS

  export class Material extends EventDispatcher {
    public id: number;

    // material type
    public type: string;

    /**
     * UUID of this material instance.
     * This gets automatically assigned, so this shouldn't be edited.
     */
    public uuid: string;

    /**
     * Override the renderer's default precision for this material.
     * Can be "highp", "mediump" or "lowp".
     */
    public precision: string | null;

    /**
     * Float in the range of 0.0 - 1.0 indicating how transparent the material is.
     * A value of 0.0 indicates fully transparent, 1.0 is fully opaque.
     * @default 1
     */
    public opacity: number;

    /**
     * Defines whether this material is transparent.
     * This has an effect on rendering as transparent objects need special treatment and are rendered after non-transparent objects.
     * When set to true, the extent to which the material is transparent is controlled by setting it's blending property.
     * @default false
     */
    public transparent: boolean;

    /**
     * Which blending to use when displaying objects with this material.
     * This must be set to zen3d.BLEND_TYPE.CUSTOM to use custom blendSrc, blendDst or blendEquation.
     */
    public blending: BLEND_TYPE;

    /**
     * Blending source.
     * The {@link zen3d.Material#blending} must be set to zen3d.BLEND_TYPE.CUSTOM for this to have any effect.
     */
    public blendSrc: BLEND_FACTOR;

    /**
     * Blending destination.
     * The {@link zen3d.Material#blending} must be set to zen3d.BLEND_TYPE.CUSTOM for this to have any effect.
     */
    public blendDst: BLEND_FACTOR;

    /**
     * Blending equation to use when applying blending.
     * The {@link zen3d.Material#blending} must be set to zen3d.BLEND_TYPE.CUSTOM for this to have any effect.
     */
    public blendEquation: BLEND_EQUATION;

    /**
     * The transparency of the {@link zen3d.Material#blendSrc}.
     * The {@link zen3d.Material#blending} must be set to zen3d.BLEND_TYPE.CUSTOM for this to have any effect.
     */
    public blendSrcAlpha: BLEND_FACTOR | null;

    /**
     * The transparency of the {@link zen3d.Material#blendDst}.
     * The {@link zen3d.Material#blending} must be set to zen3d.BLEND_TYPE.CUSTOM for this to have any effect.
     */
    public blendDstAlpha: BLEND_FACTOR | null;

    /**
     * The tranparency of the {@link zen3d.Material#blendEquation}.
     * The {@link zen3d.Material#blending} must be set to zen3d.BLEND_TYPE.CUSTOM for this to have any effect.
     */
    public blendEquationAlpha: BLEND_EQUATION | null;

    /**
     * Whether to premultiply the alpha (transparency) value.
     */
    public premultipliedAlpha: boolean;

    /**
     * Defines whether vertex coloring is used.
     */
    public vertexColors: VERTEX_COLOR;

    /**
     * The diffuse color.
     */
    public diffuse: Color3;

    /**
     * The diffuse map.
     */
    public diffuseMap: Texture2D | null;

    /**
     * Define the UV chanel for the diffuse map to use starting from 0 and defaulting to 0.
     * @default 0
     */
    public diffuseMapCoord: number;

    /**
     * The normal map.
     * @default null
     */
    public normalMap: Texture2D | null;

    /**
     * The alpha map.
     * @default null
     */
    public alphaMap: Texture2D | null;

    /**
     * Define the UV chanel for the alpha map to use starting from 0 and defaulting to 0.
     * @default 0
     */
    public alphaMapCoord: number;

    /**
     * The red channel of this texture is used as the ambient occlusion map.
     * @default null
     */
    public aoMap: Texture2D | null;

    /**
     * Intensity of the ambient occlusion effect.
     * @default 1
     */
    public aoMapIntensity: number;

    /**
     * Define the UV chanel for the ao map to use starting from 0 and defaulting to 0.
     * @default 0
     */
    public aoMapCoord: number;

    /**
     * The texture to create a bump map. The black and white values map to the
     * perceived depth in relation to the lights. Bump doesn't actually affect
     * the geometry of the object, only the lighting.
     * @default null
     */
    public bumpMap: Texture2D | null;

    /**
     * How much the bump map affects the material.
     * Typical ranges are 0-1.
     * @default 1
     */
    public bumpScale: number;

    /**
     * The environment map.
     * @default null
     */
    public envMap: TextureCube | null;

    /**
     * Scales the effect of the environment map by multiplying its color.
     * @default 1
     */
    public envMapIntensity: number;

    /**
     * How to combine the result of the surface's color with the environment map, if any.
     * This has no effect in a {@link zen3d.PBRMaterial}.
     * @default zen3d.ENVMAP_COMBINE_TYPE.MULTIPLY
     */
    public envMapCombine: ENVMAP_COMBINE_TYPE;

    /**
     * Emissive (light) color of the material, essentially a solid color unaffected by other lighting.
     * @default zen3d.Color3(0x000000)
     */
    public emissive: Color3;

    /**
     * Set emissive (glow) map.
     * The emissive map color is modulated by the emissive color and the emissive intensity.
     * If you have an emissive map, be sure to set the emissive color to something other than black.
     * @default null
     */
    public emissiveMap: Texture2D;

    /**
     * Define the UV chanel for the emissive map to use starting from 0 and defaulting to 0.
     * @default 0
     */
    public emissiveMapCoord: number;

    /**
     * Intensity of the emissive light.
     * Modulates the emissive color.
     * @default 1
     */
    public emissiveIntensity: number;

    /**
     * Which depth function to use. See the {@link zen3d.WEBGL_COMPARE_FUNC} constants for all possible values.
     * @default zen3d.WEBGL_COMPARE_FUNC.LEQUAL
     */
    public depthFunc: WEBGL_COMPARE_FUNC;

    /**
     * Whether to have depth test enabled when rendering this material.
     * @default true
     */
    public depthTest: boolean;

    /**
     * Whether rendering this material has any effect on the depth buffer.
     * When drawing 2D overlays it can be useful to disable the depth writing in order to layer several things together without creating z-index artifacts.
     * @default true
     */
    public depthWrite: boolean;

    /**
     * Whether to render the material's color.
     * This can be used in conjunction with a mesh's renderOrder property to create invisible objects that occlude other objects.
     * @default true
     */
    public colorWrite: boolean;

    /**
     * Sets the alpha value to be used when running an alpha test.
     * The material will not be renderered if the opacity is lower than this value.
     * @default 0
     */
    public alphaTest: boolean;

    /**
     * Defines which side of faces will be rendered - front, back or double.
     * @default zen3d.DRAW_SIDE.FRONT
     */
    public side: DRAW_SIDE;

    /**
     * Whether to use polygon offset.
     * This corresponds to the GL_POLYGON_OFFSET_FILL WebGL feature.
     * @default false
     */
    public polygonOffset: boolean;

    /**
     * Sets the polygon offset factor.
     * @default 0
     */
    public polygonOffsetFactor: number;

    /**
     * Sets the polygon offset units.
     * @default 0
     */
    public polygonOffsetUnits: number;

    /**
     * Define whether the material is rendered with flat shading or smooth shading.
     * @default zen3d.SHADING_TYPE.SMOOTH_SHADING
     */
    public shading: SHADING_TYPE;

    /**
     * Whether to apply dithering to the color to remove the appearance of banding.
     * @default false
     */
    public dithering: boolean;

    /**
     * Whether the material is affected by lights.
     * If set true, renderer will try to upload light uniforms.
     * @default false
     */
    public acceptLight: boolean;

    /**
     * Determines how the mesh triangles are constructed from the vertices.
     * @default zen3d.DRAW_MODE.TRIANGLES
     */
    public drawMode: DRAW_MODE;

    /**
     * Specifies that the material needs to be recompiled.
     * This property is automatically set to true when instancing a new material.
     * @default true
     */
    public needsUpdate: boolean;
  }

  export class BasicMaterial extends Material {
    public type: MATERIAL_TYPE.BASIC;
  }

  export class PBRMaterial extends Material {}

  export class TextureBase extends EventDispatcher {
    /**
     * UUID of this texture instance.
     * This gets automatically assigned, so this shouldn't be edited.
     * @type {string}
     */
    public readonly uuid: string;

    public textureType: WEBGL_TEXTURE_TYPE;

    /**
     * Array of user-specified mipmaps (optional).
     * @default []
     */
    public mipmaps: HTMLImageElement[] | Record<string, unknown>[];

    /**
     * WebGLTexture border.
     * See {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D WebGLTexture texImage2D()}.
     * Must be zero.
     * @type {number}
     */
    public border: number;

    /**
     * WebGLTexture texel data format.
     * @default zen3d.WEBGL_PIXEL_FORMAT.RGBA
     */
    public format: WEBGL_PIXEL_FORMAT;

    /**
     * WebGLTexture texel data internal format.
     * If null, internalformat is set to be same as format.
     * This must be null in WebGL 1.0.
     * @default null
     */
    public internalformat: WEBGL_PIXEL_FORMAT | null;

    /**
     * WebGLTexture texel data type.
     * @default zen3d.WEBGL_PIXEL_TYPE.UNSIGNED_BYTE
     */
    public type: WEBGL_PIXEL_TYPE;

    /**
     * How the texture is sampled when a texel covers more than one pixel.
     * @default zen3d.WEBGL_TEXTURE_FILTER.LINEAR
     */
    public magFilter: WEBGL_TEXTURE_FILTER;

    /**
     * How the texture is sampled when a texel covers less than one pixel.
     * @default zen3d.WEBGL_TEXTURE_FILTER.LINEAR_MIPMAP_LINEAR
     */
    public minFilter: WEBGL_TEXTURE_FILTER;

    /**
     * This defines how the texture is wrapped horizontally and corresponds to U in UV mapping.
     * @default zen3d.WEBGL_TEXTURE_WRAP.CLAMP_TO_EDGE
     */
    public wrapS: WEBGL_TEXTURE_WRAP;

    /**
     * This defines how the texture is wrapped vertically and corresponds to V in UV mapping.
     * @type {zen3d.WEBGL_TEXTURE_WRAP}
     * @default zen3d.WEBGL_TEXTURE_WRAP.CLAMP_TO_EDGE
     */
    public wrapT: WEBGL_TEXTURE_WRAP;

    /**
     * The number of samples taken along the axis through the pixel that has the highest density of texels.
     * A higher value gives a less blurry result than a basic mipmap, at the cost of more texture samples being used.
     * Use {@link WebGLcapabilities#maxAnisotropy} to find the maximum valid anisotropy value for the GPU; this value is usually a power of 2.
     * @default 1
     */
    public anisotropy: number;

    /**
     * Use for shadow sampler (WebGL 2.0 Only).
     * @default undefined
     */
    public compare: WEBGL_COMPARE_FUNC | undefined;

    /**
     * Whether to generate mipmaps (if possible) for a texture.
     * Set this to false if you are creating mipmaps manually.
     * @default true
     */
    public generateMipmaps: boolean;

    /**
     * texture pixel encoding.
     * @default zen3d.TEXEL_ENCODING_TYPE.LINEAR
     */
    public encoding: TEXEL_ENCODING_TYPE;

    /**
     * Flips the image's Y axis to match the WebGL texture coordinate space.
     * @default true
     */
    public flipY: boolean;

    /**
     * version code increse if texture changed.
     * if version is still 0, this texture will be skiped.
     * @default 0
     */
    public version: number;
  }

  export class Texture2D extends TextureBase {
    public textureType: WEBGL_TEXTURE_TYPE.TEXTURE_2D;

    /**
     * Image data for this texture.
     * @default null
     */
    public image: HTMLImageElement | Record<string, unknown> | null;

    /**
     * How much a single repetition of the texture is offset from the beginning,
     * in each direction U and V. Typical range is 0.0 to 1.0. _Note:_ The
     * offset property is a convenience modifier and only affects the Texture's
     * application to the first set of UVs on a model. If the Texture is used as
     * a map requiring additional UV sets (e.g. the aoMap or lightMap of most
     * stock materials), those UVs must be manually assigned to achieve the
     * desired offset..
     * @default zen3d.Vector2(0, 0)
     */
    public offset: Vector2;

    /**
     * How many times the texture is repeated across the surface, in each
     * direction U and V. If repeat is set greater than 1 in either direction,
     * the corresponding Wrap parameter should also be set to
     * {@link zen3d.WEBGL_TEXTURE_WRAP.REPEAT} or
     * {@link zen3d.WEBGL_TEXTURE_WRAP.MIRRORED_REPEAT} to achieve the desired
     * tiling effect. _Note:_ The repeat property is a convenience modifier and
     * only affects the Texture's application to the first set of UVs on a
     * model. If the Texture is used as a map requiring additional UV sets (e.g.
     * the aoMap or lightMap of most stock materials), those UVs must be
     * manually assigned to achieve the desired repetiton.
     * @default zen3d.Vector2(1, 1)
     */
    public repeat: Vector2;

    /**
     * The point around which rotation occurs.
     * A value of (0.5, 0.5) corresponds to the center of the texture.
     * Default is (0, 0), the lower left.
     * @member {zen3d.Vector2}
     * @default zen3d.Vector2(0, 0)
     */
    public center: Vector2;

    /**
     * How much the texture is rotated around the center point, in radians.
     * Postive values are counter-clockwise.
     * @default 0
     */
    public rotation: number;

    /**
     * The uv-transform matrix for the texture. Updated by the renderer from the
     * texture properties {@link zen3d.Texture2D#offset},
     * {@link zen3d.Texture2D#repeat}, {@link zen3d.Texture2D#rotation}, and
     * {@link zen3d.Texture2D#center} when the texture's
     * {@link zen3d.Texture2D#matrixAutoUpdate} property is true. When
     * {@link zen3d.Texture2D#matrixAutoUpdate}  property is false, this matrix
     * may be set manually. Default is the identity matrix.
     * @default Matrix3()
     */
    public matrix: Matrix3;

    /**
     * Whether to update the texture's uv-transform
     * {@link zen3d.Texture2D#matrix} from the texture properties
     * {@link zen3d.Texture2D#offset}, {@link zen3d.Texture2D#repeat},
     * {@link zen3d.Texture2D#rotation}, and {@link zen3d.Texture2D#center}. Set
     * this to false if you are specifying the uv-transform matrix directly.
     * @default true
     */
    public matrixAutoUpdate: boolean;

    /**
     * Whether to use the texture's uv-transform {@link zen3d.Texture2D#matrix}
     * from the texture properties {@link zen3d.Texture2D#offset},
     * {@link zen3d.Texture2D#repeat}, {@link zen3d.Texture2D#rotation}, and
     * {@link zen3d.Texture2D#center}. This is only useful when the texture is
     * an alphaMap for Now. Other material map will use a same uv-transform by
     * default.
     * @default true
     */
    public useUVTransform: boolean;

    /**
     * Create Texture2D from image.
     */
    public static fromImage(image: HTMLImageElement): Texture2D;

    /**
     * Create Texture2D from src.
     */
    public static fromSrc(src: string): Texture2D;
  }

  export class TextureCube {}

  export class Frustum {}

  export class Fog {}

  // RENDER

  export class Renderer {
    public glCore: WebGLCore;

    public backRenderTarget: RenderTargetBack;

    public shadowMapPass: ShadowMapPass;

    /**
     * Defines whether the shadow pass should automatically update.
     * @default true
     */
    public shadowAutoUpdate: boolean;

    /**
     * If {@link zen3d.Renderer.shadowAutoUpdate} is set true and this set true, shadow will update and set this to false automatically.
     * @default false
     */
    public shadowNeedsUpdate: boolean;

    /**
     * Defines whether the scene should automatically update its matrix.
     * @default true
     */
    public matrixAutoUpdate: boolean;

    /**
     * Defines whether the scene should automatically update its lights.
     * @default true
     */
    public lightsAutoupdate: boolean;

    /**
     * Defines whether the renderer should automatically clear its output before rendering a frame.
     * @default true
     */
    public autoClear: boolean;

    public constructor(
      canvas: HTMLCanvasElement,
      options: WebGLContextAttributes
    );

    /**
     * Render a scene using a camera.
     * The render is done to the renderTarget (if specified) or to the canvas as usual.
     * @param {zen3d.Scene} scene - The scene.
     * @param {zen3d.Camera} camera - The camera.
     * @param {zen3d.RenderTargetBase} [renderTarget=] - The render is done to the renderTarget (if specified) or to the canvas as usual.
     * @param {boolean} [forceClear=false] - If set true, the depth, stencil and color buffers will be cleared before rendering even if the renderer's autoClear property is false.
     */
    public render(
      scene: Scene,
      camera: Camera,
      renderTarget?: RenderTargetBase,
      forceClear?: boolean
    ): void;
  }

  export class WebGLCore {
    public properties: WebGLProperties;

    /**
     * An object containing details about the capabilities of the current RenderingContext.
     */
    public capabilities: WebGLCapabilities;

    public state: WebGLState;

    public texture: WebGLTexture;

    public renderTarget: WebGLRenderTarget;

    public geometry: WebGLGeometry;

    public programs: WebGLPrograms;

    public constructor(gl: WebGLRenderingContext);

    public clear(color?: boolean, depth?: boolean, stencil?: boolean): void;

    public render(
      scene: Scene,
      camera: Camera,
      updateRenderList?: boolean
    ): void;
  }

  export class WebGLProperties {}

  export class WebGLCapabilities {}

  export class WebGLState {
    public colorBuffer: ColorBuffer;
  }

  export class WebGLRenderTarget {}

  export class WebGLGeometry {}

  export class WebGLPrograms {}

  export class RenderTargetBase extends EventDispatcher {
    public width: number;
    public height: number;

    public dispose(): void;

    public resize(width: number, height: number): boolean;
  }

  /**
   * Render Target that render to canvas element.
   */
  export class RenderTargetBack extends RenderTargetBase {
    public constructor(canvas: HTMLCanvasElement);
  }

  export class ShadowMapPass {}

  class ColorBuffer {
    //@ts-ignore
    public setClear(
      r: number,
      g: number,
      b: number,
      a: number,
      premultipliedAlpha?: boolean
    );
  }

  // LIGHTING

  export class Light extends Object3D {
    public type: OBJECT_TYPE.LIGHT;

    public lightType: LIGHT_TYPE;

    public color: Color3;

    public intensity: number;
  }

  export class AmbientLight extends Light {
    public lightType: LIGHT_TYPE.AMBIENT;

    public constructor(color?: Color3 | number, intensity?: number);
  }

  export class DirectionalLight extends Light {
    public lightType: LIGHT_TYPE.DIRECT;

    public shadow: DirectionalLightShadow;

    public constructor(color?: Color3 | number, intensity?: number);
  }

  export class DirectionalLightShadow {}
}

/* eslint-enable @typescript-eslint/explicit-module-boundary-types */
/* eslint-enable @typescript-eslint/no-explicit-any */
