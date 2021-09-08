import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Point, Vector3 } from '@vertexvis/geometry';
import {
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  GridHelper,
  Line,
  Line3,
  LinearFilter,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Plane,
  PlaneHelper,
  Ray,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3 as Vec3,
} from 'three';
import { InteractionHandler } from '../..';
import { Disposable } from '../../../../utils/dist';
import '../../components';
import { getMouseClientPosition } from '../dom';
import { InteractionApi } from '../interactions';
import { Raycaster } from '../scenes';
import { FlexTimeApi } from '../vertex-geometry/flexApi';
import { StringValue } from '../../../../flex-time-protos/dist/google/protobuf/wrappers';
import {
  MeasureRequest,
  MeasureResponse,
} from '@vertexvis/flex-time-protos/dist/flex-time-service/protos/flex_time_api';

interface IdleState {
  type: 'idle';
  feedbackPt?: Vector3.Vector3;
}

interface StartedState {
  type: 'started';
  feedbackPt?: Vector3.Vector3;
  startWorldPt: Vector3.Vector3;
  startHit: Promise<vertexvis.protobuf.stream.IHit | undefined>;
}

interface PickedState {
  type: 'picked';
  startWorldPt: Vector3.Vector3;
  startHit: Promise<vertexvis.protobuf.stream.IHit | undefined>;
  endWorldPt: Vector3.Vector3;
  endHit: Promise<vertexvis.protobuf.stream.IHit | undefined>;
}

interface PlacementState {
  type: 'placement';
  startWorldPt: Vec3;
  endWorldPt: Vec3;
  startPlane: Plane;
  endPlane: Plane;
  placementPlane: Plane;
  placementPosition: Vec3;
  measurementLine: Line3;
  text: string;
  xWorldPt: Vec3;
  yWorldPt: Vec3;
  zWorldPt: Vec3;
}
interface MeasurementResult {
  approximateDistance?: number;
  planarDistance?: number;
  minimumDistance?: number;
  angleInRadians?: number;
}
type InteractionState = IdleState | StartedState | PickedState | PlacementState;

export class SurfaceMeasurement implements InteractionHandler {
  private state: InteractionState = { type: 'idle' };

  private pointerMesh: Mesh;
  private startMesh: Mesh;
  private endMesh: Mesh;
  private measurementLineMesh: Line;
  private startLeaderLineMesh: Line;
  private endLeaderLineMesh: Line;
  private planeSprite: Sprite;
  private textTexture: TextTexture;

  private startPlaneHelper: PlaneHelper;
  private endPlaneHelper: PlaneHelper;
  private placementPlaneHelper: PlaneHelper;

  private xPosMesh: Mesh;
  private xPlaneMesh: GridHelper;
  private yPosMesh: Mesh;
  private yPlaneMesh: GridHelper;
  private zPosMesh: Mesh;
  private zPlaneMesh: GridHelper;

  private api?: InteractionApi;
  private element?: HTMLElement;
  private flexClient: FlexTimeApi;
  private sceneId: string;

  /* eslint-disable lines-between-class-members */
  public _showHelpers = false;
  public set showHelpers(value: boolean) {
    this._showHelpers = value;
    this.render();
  }
  public get showHelpers(): boolean {
    return this._showHelpers;
  }
  /* eslint-enable lines-between-class-members */

  public constructor(
    private renderer: HTMLVertexViewerThreejsRendererElement,
    private scene: Scene,
    private scene_id: string,
    private flexHost: string = 'https://flex.platdev.vertexvis.io'
  ) {
    const sphere = new SphereGeometry();
    const pointerMaterial = new MeshPhongMaterial({ color: 0xff0000 });
    this.pointerMesh = new Mesh(sphere, pointerMaterial);
    this.pointerMesh.scale.set(5, 5, 5);
    this.scene.add(this.pointerMesh);

    const anchorMaterial = new MeshBasicMaterial({ color: 0x000000 });
    this.startMesh = new Mesh(sphere, anchorMaterial);
    this.startMesh.scale.set(2, 2, 2);
    this.scene.add(this.startMesh);
    this.endMesh = new Mesh(sphere, anchorMaterial);
    this.endMesh.scale.set(2, 2, 2);
    this.scene.add(this.endMesh);

    const lineMaterial = new LineBasicMaterial({ color: 0x444444 });
    this.measurementLineMesh = new Line(new BufferGeometry(), lineMaterial);
    this.scene.add(this.measurementLineMesh);
    this.startLeaderLineMesh = new Line(new BufferGeometry(), lineMaterial);
    this.scene.add(this.startLeaderLineMesh);
    this.endLeaderLineMesh = new Line(new BufferGeometry(), lineMaterial);
    this.scene.add(this.endLeaderLineMesh);

    this.textTexture = new TextTexture('', { fontSize: 32 });
    this.planeSprite = new Sprite(
      new SpriteMaterial({ map: this.textTexture })
    );
    this.scene.add(this.planeSprite);

    this.startPlaneHelper = new PlaneHelper(new Plane(), 500, 0xff0000);
    // this.scene.add(this.startPlaneHelper);
    this.endPlaneHelper = new PlaneHelper(new Plane(), 500, 0xff0000);
    // this.scene.add(this.endPlaneHelper);
    this.placementPlaneHelper = new PlaneHelper(new Plane(), 500, 0xff0000);
    // this.scene.add(this.placementPlaneHelper);

    this.xPosMesh = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: 0xff0000 })
    );
    this.xPosMesh.scale.set(4, 4, 4);
    this.scene.add(this.xPosMesh);

    this.yPosMesh = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: 0x00ff00 })
    );
    this.yPosMesh.scale.set(4, 4, 4);
    this.scene.add(this.yPosMesh);

    this.zPosMesh = new Mesh(
      sphere,
      new MeshBasicMaterial({ color: 0x0000ff })
    );
    this.zPosMesh.scale.set(4, 4, 4);
    this.scene.add(this.zPosMesh);

    this.xPlaneMesh = new GridHelper(1000, 10, 0xff0000, 0xffa7a8);
    this.xPlaneMesh.rotation.set(0, 0, 0);
    this.scene.add(this.xPlaneMesh);

    this.yPlaneMesh = new GridHelper(1000, 10, 0x00ff00, 0xa5ffa5);
    this.yPlaneMesh.rotation.set(Math.PI / 2, 0, 0);
    this.scene.add(this.yPlaneMesh);

    this.zPlaneMesh = new GridHelper(1000, 10, 0x0000ff, 0xa5a5ff);
    this.zPlaneMesh.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    this.scene.add(this.zPlaneMesh);
    this.flexClient = FlexTimeApi.create(flexHost);
    this.sceneId = scene_id;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.element.addEventListener('pointermove', this.handlePointerMove);
    this.element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.element = undefined;
    this.api = undefined;
  }

  public clear(): void {
    this.updateState({ type: 'idle' });
  }

  private handlePointerMove = (event: PointerEvent): void => {
    this.ifInitialized(async ({ element, api }) => {
      const pt = getMouseClientPosition(event, element.getBoundingClientRect());
      const worldPt = await api.transformViewportToWorld(pt, {
        depthTest: true,
      });

      if (this.state.type === 'idle' || this.state.type === 'started') {
        this.updateState({ ...this.state, feedbackPt: worldPt });
      }
    });
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.ifInitialized(async ({ element, api }) => {
      const pt = getMouseClientPosition(event, element.getBoundingClientRect());
      const worldPt = await api.transformViewportToWorld(pt, {
        depthTest: true,
      });

      if (worldPt != null) {
        if (this.state.type === 'idle') {
          this.updateState({
            type: 'started',
            startHit: getHit(pt, api.scene.raycaster()),
            startWorldPt: worldPt,
          });
        } else if (this.state.type === 'started') {
          const state: PickedState = {
            type: 'picked',
            startHit: this.state.startHit,
            startWorldPt: this.state.startWorldPt,
            endWorldPt: worldPt,
            endHit: getHit(pt, api.scene.raycaster()),
          };
          this.updateState(state);
          this.handlePicked(state);
        }
      }
    });
  };

  private radiansToDegrees(rad?: number): number | undefined {
    if (typeof rad === 'number') {
      return (rad * 180.0) / Math.PI;
    }
  }

  private measureResultToText(measure: MeasurementResult): string {
    return [
      {
        value: measure?.approximateDistance,
        toString: (v: MeasurementResult) =>
          `~${v?.approximateDistance?.toFixed(2)} mm`,
      },
      {
        value: measure?.angleInRadians,
        toString: (v: MeasurementResult) =>
          `${this.radiansToDegrees(v.angleInRadians)?.toFixed(2)} deg`,
      },
      {
        value: measure?.planarDistance,
        toString: (v: MeasurementResult) =>
          `${v?.planarDistance?.toFixed(2)} mm (planar)`,
      },
      {
        value: measure?.minimumDistance,
        toString: (v: MeasurementResult) =>
          `${v?.minimumDistance?.toFixed(2)} mm (min)`,
      },
    ]
      .filter((v) => typeof v.value !== 'undefined')
      .map((v) => v.toString(measure))
      .join('\n');
  }

  private approximateDistance(
    startHitPt: vertexvis.protobuf.core.IVector3f,
    endHitPt: vertexvis.protobuf.core.IVector3f
  ): number {
    // this may need to be more complicated but currently is just taking
    // the hit points and calculating the distance
    const startWorldPt = makeVector3(startHitPt);
    const endWorldPt = makeVector3(endHitPt);
    return Vector3.distance(startWorldPt, endWorldPt);
  }

  private async requestFromPick(state: PickedState): Promise<MeasureRequest> {
    const [startHit, endHit] = await Promise.all([
      state.startHit,
      state.endHit,
    ]);
    const startHitPt = startHit?.hitPoint;
    const endHitPt = endHit?.hitPoint;
    const startHitItem = startHit?.itemId?.hex;
    const endHitItem = endHit?.itemId?.hex;

    //todo look out!
    return {
      sceneItemIdA: { value: startHitItem } as StringValue,
      hitPointA: {
        x: startHitPt?.x as number,
        y: startHitPt?.y as number,
        z: startHitPt?.z as number,
      },
      sceneItemIdB: { value: endHitItem } as StringValue,
      hitPointB: {
        x: endHitPt?.x as number,
        y: endHitPt?.y as number,
        z: endHitPt?.z as number,
      },
      scene: { value: this.sceneId },
      sceneView: { value: this.api?.scene.sceneViewId as string },
    };
  }

  private async measure(
    preciseMeasurementRequest: MeasureRequest,
    preciseMeasurementTextResultHandler: (
      measurementResultAsText: string
    ) => void,
    approximateDistance?: number
  ): Promise<void> {
    const serverCall = this.flexClient.measure(preciseMeasurementRequest);
    let measurementResult = {};
    // set the approximate distance
    measurementResult = {
      ...measurementResult,
      approximateDistance: approximateDistance,
    };
    serverCall.responses.onNext(
      (message?: MeasureResponse, error?: Error, complete?: boolean) => {
        //this hefty callback takes the measurement response (one currently) and
        // updates the text displayed in the sprite
        if (message !== undefined && message?.outcome !== undefined) {
          for (const result of message.outcome.results) {
            if (result.details.oneofKind === 'planarDistance') {
              measurementResult = {
                ...measurementResult,
                planarDistance: result.details.planarDistance.distance,
              };
            } else if (result.details.oneofKind === 'angle') {
              measurementResult = {
                ...measurementResult,
                angleInRadians: result.details.angle.angleInRadians,
              };
            } else if (result.details.oneofKind === 'minimumDistance') {
              measurementResult = {
                ...measurementResult,
                minimumDistance: result.details.minimumDistance.distance,
              };
            }
          }
        } else if (error || complete) {
          if (error) {
            console.error(
              'Encountered error during precise measurement computation!' +
                error
            );
          } else {
            console.info(
              `Precise measurement result complete! ${measurementResult}`
            );
          }
        }
        // convert the result to text...in the future, this processing would be more intricate, using
        // more of the returned data to place the annotations
        const measurementAsText = this.measureResultToText(measurementResult);
        preciseMeasurementTextResultHandler(measurementAsText);
      }
    );
  }

  private async handlePicked(state: PickedState): Promise<void> {
    this.ifInitialized(async ({ element, api }) => {
      const [startHit, endHit] = await Promise.all([
        state.startHit,
        state.endHit,
      ]);

      const startHitPt = startHit?.hitPoint;
      const startNormal = startHit?.hitNormal;
      const endHitPt = endHit?.hitPoint;
      const endNormal = endHit?.hitNormal;
      const startHitItem = startHit?.itemId?.hex;
      const endHitItem = endHit?.itemId?.hex;

      if (
        startHitPt != null &&
        startNormal != null &&
        endHitPt != null &&
        endNormal != null &&
        startHitItem != null &&
        endHitItem != null
      ) {
        const startDir = makeVector3(startNormal);
        const endDir = makeVector3(endNormal);
        const startWorldPt = makeVector3(startHitPt);
        const endWorldPt = makeVector3(endHitPt);
        const approximateDistance = this.approximateDistance(
          startWorldPt,
          endWorldPt
        );
        // todo pull this out somehow
        this.requestFromPick(state).then((req) =>
          this.measure(
            req,
            (measurementAsText) => {
              //const dot = startDir.dot(endDir);
              if (true) {
                // Always true here to allow angle measurements
                // TODO add this back to prevent angle measurements
                //Math.abs(dot) === 1) {

                const startPlane = new Plane().setFromNormalAndCoplanarPoint(
                  startDir,
                  startWorldPt
                );
                const endPlane = new Plane().setFromNormalAndCoplanarPoint(
                  endDir,
                  endWorldPt
                );
                const projectedWorldPt = startPlane.projectPoint(
                  new Vec3(endWorldPt.x, endWorldPt.y, endWorldPt.z),
                  new Vec3()
                );
                const placementPlane = new Plane().setFromNormalAndCoplanarPoint(
                  new Vec3(0, 0, 1),
                  endWorldPt
                );
                const interaction: Disposable = {
                  dispose: () => {
                    window.removeEventListener(
                      'pointermove',
                      handlePointerMove
                    );
                    window.removeEventListener(
                      'pointerdown',
                      handlePointerDown
                    );
                  },
                };

                const xPlane = new Plane().setFromNormalAndCoplanarPoint(
                  new Vec3(0, 1, 0),
                  endWorldPt
                );
                const yPlane = new Plane().setFromNormalAndCoplanarPoint(
                  new Vec3(0, 0, 1),
                  endWorldPt
                );
                const zPlane = new Plane().setFromNormalAndCoplanarPoint(
                  new Vec3(1, 0, 0),
                  endWorldPt
                );

                const handlePointerMove = (event: PointerEvent): void => {
                  const pt = getMouseClientPosition(
                    event,
                    element.getBoundingClientRect()
                  );
                  const ray = api.getRayFromPoint(pt);
                  const pickRay = new Ray(
                    new Vec3(ray.origin.x, ray.origin.y, ray.origin.z),
                    new Vec3(ray.direction.x, ray.direction.y, ray.direction.z)
                  );

                  const xPlanePt =
                    pickRay.intersectPlane(xPlane, new Vec3()) ?? endWorldPt;
                  const yPlanePt =
                    pickRay.intersectPlane(yPlane, new Vec3()) ?? endWorldPt;
                  const zPlanePt =
                    pickRay.intersectPlane(zPlane, new Vec3()) ?? endWorldPt;

                  const xPt = new Vec3()
                    .subVectors(xPlanePt, endWorldPt)
                    .projectOnVector(new Vec3(1, 0, 0))
                    .add(endWorldPt);
                  const yPt = new Vec3()
                    .subVectors(yPlanePt, endWorldPt)
                    .projectOnVector(new Vec3(0, 1, 0))
                    .add(endWorldPt);
                  const zPt = new Vec3()
                    .subVectors(zPlanePt, endWorldPt)
                    .projectOnVector(new Vec3(0, 0, 1))
                    .add(endWorldPt);

                  const lineDir = new Vec3()
                    .subVectors(endWorldPt, projectedWorldPt)
                    .normalize();
                  const xDot = Math.abs(lineDir.dot(new Vec3(1, 0, 0)));
                  const yDot = Math.abs(lineDir.dot(new Vec3(0, 1, 0)));
                  const zDot = Math.abs(lineDir.dot(new Vec3(0, 0, 1)));

                  const xDist = xPt.distanceTo(endWorldPt);
                  const yDist = yPt.distanceTo(endWorldPt);
                  const zDist = zPt.distanceTo(endWorldPt);

                  const axises = [
                    { plane: xPlane, pt: xPt, dot: xDot, dist: xDist },
                    { plane: yPlane, pt: yPt, dot: yDot, dist: yDist },
                    { plane: zPlane, pt: zPt, dot: zDot, dist: zDist },
                  ];

                  const possibleAxes = axises
                    .sort((a, b) => a.dot - b.dot)
                    .slice(0, 2);

                  const axis = possibleAxes.sort((a, b) => b.dist - a.dist)[0];

                  let newLineStartPt = new Vec3();
                  let newLineEndPt = new Vec3();
                  let placementPosition = new Vec3();

                  if (axis.pt === xPt) {
                    newLineStartPt = new Vec3()
                      .subVectors(xPt, projectedWorldPt)
                      .projectOnVector(new Vec3(1, 0, 0))
                      .add(projectedWorldPt);
                    newLineEndPt = new Vec3()
                      .subVectors(xPt, endWorldPt)
                      .projectOnVector(new Vec3(1, 0, 0))
                      .add(endWorldPt);
                    placementPosition = xPt;
                  } else if (axis.pt === yPt) {
                    newLineStartPt = new Vec3()
                      .subVectors(yPt, projectedWorldPt)
                      .projectOnVector(new Vec3(0, 1, 0))
                      .add(projectedWorldPt);
                    newLineEndPt = new Vec3()
                      .subVectors(yPt, endWorldPt)
                      .projectOnVector(new Vec3(0, 1, 0))
                      .add(endWorldPt);
                    placementPosition = yPt;
                  } else {
                    newLineStartPt = new Vec3()
                      .subVectors(zPt, projectedWorldPt)
                      .projectOnVector(new Vec3(0, 0, 1))
                      .add(projectedWorldPt);
                    newLineEndPt = new Vec3()
                      .subVectors(zPt, endWorldPt)
                      .projectOnVector(new Vec3(0, 0, 1))
                      .add(endWorldPt);
                    placementPosition = zPt;
                  }

                  this.updateState({
                    type: 'placement',
                    text: measurementAsText,
                    startWorldPt,
                    startPlane,
                    endWorldPt,
                    endPlane,
                    placementPlane,
                    placementPosition: placementPosition,
                    measurementLine: new Line3(newLineStartPt, newLineEndPt),
                    xWorldPt: xPt,
                    yWorldPt: yPt,
                    zWorldPt: zPt,
                  });
                };

                const handlePointerDown = (): void => {
                  console.log('done');
                  interaction.dispose();
                };

                window.addEventListener('pointermove', handlePointerMove);
                window.addEventListener('pointerdown', handlePointerDown);

                this.updateState({
                  type: 'placement',
                  text: measurementAsText,
                  startWorldPt,
                  startPlane,
                  endWorldPt,
                  endPlane,
                  placementPlane,
                  placementPosition: endWorldPt,
                  measurementLine: new Line3(projectedWorldPt, endWorldPt),
                  xWorldPt: new Vec3(),
                  yWorldPt: new Vec3(),
                  zWorldPt: new Vec3(),
                });
              } else {
                this.updateState({ type: 'idle' });
              }
            },
            approximateDistance
          )
        );
      }
    });
  }

  private ifInitialized(
    f: (data: { element: HTMLElement; api: InteractionApi }) => void
  ): void {
    if (this.element != null && this.api != null) {
      f({ element: this.element, api: this.api });
    }
  }

  private updateState(state: InteractionState): void {
    this.state = state;
    this.render();
  }

  private render(): void {
    this.pointerMesh.visible = false;
    this.startMesh.visible = false;
    this.endMesh.visible = false;
    this.measurementLineMesh.visible = false;
    this.startLeaderLineMesh.visible = false;
    this.endLeaderLineMesh.visible = false;
    this.planeSprite.visible = false;
    this.startPlaneHelper.visible = false;
    this.endPlaneHelper.visible = false;
    this.placementPlaneHelper.visible = false;
    this.xPlaneMesh.visible = false;
    this.yPlaneMesh.visible = false;
    this.zPlaneMesh.visible = false;
    this.xPosMesh.visible = false;
    this.yPosMesh.visible = false;
    this.zPosMesh.visible = false;

    this.renderFeedback(this.state);

    if (this.state.type === 'started') {
      this.renderStarted(this.state);
    } else if (this.state.type === 'picked') {
      this.renderPicked(this.state);
    } else if (this.state.type === 'placement') {
      this.renderPlacement(this.state);
    }

    this.renderer.draw();
  }

  private renderFeedback(state: InteractionState): void {
    if (
      (state.type === 'idle' || state.type === 'started') &&
      state.feedbackPt != null
    ) {
      const { x, y, z } = state.feedbackPt;
      this.pointerMesh.position.set(x, y, z);
      this.pointerMesh.visible = true;
    }
  }

  private renderStarted(state: StartedState): void {
    const { x, y, z } = state.startWorldPt;
    this.startMesh.position.set(x, y, z);
    this.startMesh.visible = true;
  }

  private renderPicked(state: PickedState): void {
    this.ifInitialized(({ api }) => {
      const { x: startX, y: startY, z: startZ } = state.startWorldPt;
      const { x: endX, y: endY, z: endZ } = state.endWorldPt;
      const center = Vector3.lerp(state.startWorldPt, state.endWorldPt, 0.5);

      this.startMesh.position.set(startX, startY, startZ);
      this.startMesh.visible = true;

      this.endMesh.position.set(endX, endY, endZ);
      this.endMesh.visible = true;

      this.measurementLineMesh.geometry.setFromPoints([
        new Vec3(startX, startY, startZ),
        new Vec3(endX, endY, endZ),
      ]);
      this.measurementLineMesh.visible = true;
      const approximateDistance = this.approximateDistance(
        state.startWorldPt,
        state.endWorldPt
      );
      this.requestFromPick(state).then((req) => {
        this.measure(
          req,
          (measurementAsText) => {
            const text = measurementAsText;
            if (this.textTexture.text !== text) {
              this.textTexture.text = text;
              this.textTexture.update();

              const aspect = this.textTexture.width / this.textTexture.height;
              const size = 512;
              this.planeSprite.scale.set(size, size / aspect, 1);
            }

            if (api.camera) {
              this.planeSprite.position.set(center.x, center.y, center.z);
              this.planeSprite.visible = true;
            }
          },
          approximateDistance
        );
      });
    });
  }

  private renderPlacement(state: PlacementState): void {
    this.ifInitialized(({ api }) => {
      const center = new Vec3().lerpVectors(
        state.measurementLine.start,
        state.measurementLine.end,
        0.5
      );

      this.pointerMesh.position.set(
        state.placementPosition.x,
        state.placementPosition.y,
        state.placementPosition.z
      );
      this.pointerMesh.visible = true;

      this.measurementLineMesh.geometry.setFromPoints([
        state.measurementLine.start,
        state.measurementLine.end,
      ]);
      this.measurementLineMesh.visible = true;

      this.startLeaderLineMesh.geometry.setFromPoints([
        state.startWorldPt,
        state.measurementLine.start,
      ]);
      this.startLeaderLineMesh.visible = true;

      this.endLeaderLineMesh.geometry.setFromPoints([
        state.endWorldPt,
        state.measurementLine.end,
      ]);
      this.endLeaderLineMesh.visible = true;

      const text = `${state.text}`;
      if (this.textTexture.text !== text) {
        this.textTexture.text = text;
        this.textTexture.update();

        const aspect = this.textTexture.width / this.textTexture.height;
        const size = 512;
        this.planeSprite.scale.set(size, size / aspect, 1);
      }

      if (api.camera) {
        this.planeSprite.position.set(center.x, center.y, center.z);
        this.planeSprite.visible = true;
      }

      this.startPlaneHelper.plane = state.startPlane;
      this.startPlaneHelper.visible = true;

      this.endPlaneHelper.plane = state.endPlane;
      this.endPlaneHelper.visible = true;

      this.placementPlaneHelper.plane = state.placementPlane;
      this.placementPlaneHelper.visible = true;

      this.xPlaneMesh.position.copy(state.endWorldPt);
      this.xPlaneMesh.visible = this._showHelpers;

      this.yPlaneMesh.position.copy(state.endWorldPt);
      this.yPlaneMesh.visible = this._showHelpers;

      this.zPlaneMesh.position.copy(state.endWorldPt);
      this.zPlaneMesh.visible = this._showHelpers;

      this.xPosMesh.position.copy(state.xWorldPt);
      this.xPosMesh.visible = this._showHelpers;

      this.yPosMesh.position.copy(state.yWorldPt);
      this.yPosMesh.visible = this._showHelpers;

      this.zPosMesh.position.copy(state.zWorldPt);
      this.zPosMesh.visible = this._showHelpers;
    });
  }
}

async function getHit(
  pt: Point.Point,
  raycaster: Raycaster
): Promise<vertexvis.protobuf.stream.IHit | undefined> {
  const res = await raycaster.hitItems(pt);
  const hit = res?.hits ?? [];
  return hit[0];
}

function makeVector3(proto: vertexvis.protobuf.core.IVector3f): Vec3 {
  const { x, y, z } = proto;
  return new Vec3(x ?? 0, y ?? 0, z ?? 0);
}

interface TextTextureOptions {
  font: string;
  fontSize: number;
  color: string;
}

class TextTexture extends CanvasTexture {
  private canvas: HTMLCanvasElement;

  public text: string;
  private opts: TextTextureOptions;

  public constructor(text = '', opts: Partial<TextTextureOptions> = {}) {
    const canvas = document.createElement('canvas');
    super(canvas);

    this.canvas = canvas;
    this.text = text;
    this.opts = {
      font: opts.font ?? 'Arial',
      fontSize: opts.fontSize ?? 12,
      color: 'black',
    };

    this.minFilter = LinearFilter;
    this.wrapS = ClampToEdgeWrapping;
    this.wrapT = ClampToEdgeWrapping;

    this.update();
  }

  public get width(): number {
    return this.canvas.width;
  }

  public get height(): number {
    return this.canvas.height;
  }

  public update(): void {
    const ctx = this.canvas.getContext('2d');
    const metrics = this.measureText();

    if (ctx != null && metrics != null) {
      this.needsUpdate = true;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.canvas.width = metrics.width > 1 ? metrics.width : 1;
      ctx.font = this.font;
      // ctx.textBaseline = 'top';

      ctx.fillStyle = this.opts.color;
      // support multiline text
      const lines = this.text.split('\n');
      const x = 0;
      const actualHeight =
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

      const lineHeight = 15;
      const y = lineHeight;
      this.canvas.height = actualHeight * lines.length;
      for (let i = 0; i < lines.length; i++)
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
  }

  private measureText(): TextMetrics | undefined {
    const ctx = this.canvas.getContext('2d');
    if (ctx != null) {
      ctx.font = this.font;
      const lines = this.text.split('\n');
      const sorted = lines.sort((a, b) => {
        return b.length - a.length;
      });
      return ctx.measureText(sorted[0]);
    }
  }

  private get font(): string {
    return `${this.opts.fontSize}px ${this.opts.font}`;
  }
}
