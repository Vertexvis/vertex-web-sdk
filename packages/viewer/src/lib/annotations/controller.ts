import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import { Pager } from '@vertexvis/scene-view-protos/core/protos/paging_pb';
import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import {
  CreateSceneViewAnnotationSetRequest,
  DeleteSceneViewAnnotationSetRequest,
  ListSceneAnnotationsRequest,
  ListSceneAnnotationsResponse,
  ListSceneViewAnnotationSetsRequest,
  ListSceneViewAnnotationSetsResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';
import { Async } from '@vertexvis/utils';

import { delay } from '../../testing/utils';
import {
  createMetadata,
  JwtProvider,
  requestPaged,
  requestUnary,
} from '../grpc';
import {
  fromPbAnnotationOrThrow,
  fromPbAnnotationSetOrThrow,
} from '../mappers/annotation';
import { Annotation, AnnotationSet } from './annotation';

export interface AnnotationState {
  annotations: Record<AnnotationSet['id'], Annotation[]>;
}

/**
 * The controller for managing the annotations of a scene and scene view.
 */
export class AnnotationController {
  /**
   * A dispatcher that emits an event whenever the state of the annotations has
   * changed. The annotation state includes the annotation sets that are active
   * and the annotations that belong to each set.
   */
  public onStateChange = new EventDispatcher<AnnotationState>();

  private state?: AnnotationState;

  private connection?: Disposable;

  public constructor(
    private client: SceneViewAPIClient,
    private jwtProvider: JwtProvider,
    private deviceIdProvider: () => string | undefined
  ) {}

  /**
   * Activates an annotation set for the current session. This method will emit
   * an event on `onStateChange` when the annotation set has been added, and
   * return a promise the resolves with the new annotation state.
   *
   * @param id The ID of the annotation set.
   * @returns A promise that resolves with the new annotation state.
   */
  public async addAnnotationSet(id: UUID.UUID): Promise<AnnotationState> {
    await requestUnary(async (handler) => {
      const deviceId = this.deviceIdProvider();
      const meta = await createMetadata(this.jwtProvider, deviceId);

      const req = new CreateSceneViewAnnotationSetRequest();

      const setId = new Uuid();
      setId.setHex(id);
      req.setSceneAnnotationSetId(setId);

      this.client.createSceneViewAnnotationSet(req, meta, handler);
    });

    return this.fetch();
  }

  /**
   * Stops the automatic retrieval of annotation state.
   */
  public disconnect(): void {
    if (this.connection != null) {
      this.connection.dispose();
      this.connection = undefined;
    }
  }

  /**
   * Starts the automatic retrieval of annotation state. When a new annotation
   * state is retrieved, an event will be emitted on `onStateChange`.
   *
   * @param pollingIntervalInMs The interval to poll for a new annotation state.
   */
  public connect(pollingIntervalInMs = 10000): void {
    this.disconnect();

    const controller = this.pollAnnotationState(pollingIntervalInMs);
    this.connection = { dispose: () => controller.abort() };
  }

  /**
   * Performs a manual fetch of the annotation state. This method will emit an
   * event on `onStateChange` when the annotation set has been added, and return
   * a promise the resolves with the new annotation state.
   *
   * @param opts Options to configure the fetch behavior. If an abort signal is
   *   given, then this will not emit an change event if the signal is aborted.
   * @returns A promise that resolves with the new annotation state.
   */
  public async fetch(
    opts: {
      signal?: AbortSignal;
    } = {}
  ): Promise<AnnotationState> {
    const sets = await this.fetchAnnotationSetsAsArray();
    const annotations = await this.fetchAnnotationsAsArray(sets);

    const state = (await Promise.all(annotations)).reduce(
      (state, [set, annotations]) => ({
        annotations: { ...state.annotations, [set.id]: annotations },
      }),
      { annotations: {} } as AnnotationState
    );

    if (opts.signal == null || !opts.signal.aborted) {
      this.updateState(state);
    }

    return state;
  }

  /**
   * Deactivates an annotation set for the current session. This method will
   * emit an event on `onStateChange` when the annotation set has been added,
   * and return a promise the resolves with the new annotation state.
   *
   * @param id The ID of the annotation set.
   * @returns A promise that resolves with the new annotation state.
   */
  public async removeAnnotationSet(id: UUID.UUID): Promise<AnnotationState> {
    await requestUnary(async (handler) => {
      const deviceId = this.deviceIdProvider();
      const meta = await createMetadata(this.jwtProvider, deviceId);
      const req = new DeleteSceneViewAnnotationSetRequest();

      const setId = new Uuid();
      setId.setHex(id);
      req.setSceneAnnotationSetId(setId);

      this.client.deleteSceneViewAnnotationSet(req, meta, handler);
    });

    return this.fetch();
  }

  private pollAnnotationState(pollingIntervalInMs: number): AbortController {
    const controller = new AbortController();

    const poll = async (delayMs: number): Promise<void> => {
      await this.fetch({ signal: controller.signal });

      if (!controller.signal.aborted) {
        await delay(delayMs);
        await poll(delayMs);
      }
    };

    Async.abort(controller.signal, poll(pollingIntervalInMs));
    return controller;
  }

  private fetchAnnotationSets(): AsyncGenerator<
    ListSceneViewAnnotationSetsResponse,
    void
  > {
    return requestPaged(
      (cursor) => async (handler) => {
        const deviceId = this.deviceIdProvider();
        const meta = await createMetadata(this.jwtProvider, deviceId);

        const req = new ListSceneViewAnnotationSetsRequest();

        if (cursor != null) {
          const page = new Pager();
          page.setCursor(cursor);
          page.setLimit(100);
          req.setPage(page);
        }

        this.client.listSceneViewAnnotationSets(req, meta, handler);
      },
      (res) => res.toObject().nextCursor?.next
    );
  }

  private async fetchAnnotationSetsAsArray(): Promise<AnnotationSet[]> {
    return (await Async.asArray(this.fetchAnnotationSets()))
      .flatMap((res) => res.getSceneAnnotationSetsList())
      .map((set) => fromPbAnnotationSetOrThrow(set));
  }

  private fetchAnnotations(
    setId: UUID.UUID
  ): AsyncGenerator<ListSceneAnnotationsResponse, void> {
    return requestPaged(
      (cursor) => async (handler) => {
        const deviceId = this.deviceIdProvider();
        const meta = await createMetadata(this.jwtProvider, deviceId);

        const setIdLong = UUID.toMsbLsb(setId);

        const id = new Uuid2l();
        id.setMsb(setIdLong.msb);
        id.setLsb(setIdLong.lsb);

        const req = new ListSceneAnnotationsRequest();
        req.setSceneAnnotationSetId(id);

        if (cursor != null) {
          const page = new Pager();
          page.setCursor(cursor);
          page.setLimit(100);
          req.setPage(page);
        }

        this.client.listSceneAnnotations(req, meta, handler);
      },
      (res) => res.toObject().nextCursor?.next
    );
  }

  private fetchAnnotationsAsArray(
    sets: AnnotationSet[]
  ): Promise<[AnnotationSet, Annotation[]][]> {
    const annotations = sets.map(async (set) => {
      const annotations = (await Async.asArray(this.fetchAnnotations(set.id)))
        .flatMap((ann) => ann.getSceneAnnotationsList())
        .map((ann) => fromPbAnnotationOrThrow(ann));
      return [set, annotations] as [AnnotationSet, Annotation[]];
    });

    return Promise.all(annotations);
  }

  private updateState(state: AnnotationState): void {
    this.state = state;
    this.onStateChange.emit(state);
  }
}
