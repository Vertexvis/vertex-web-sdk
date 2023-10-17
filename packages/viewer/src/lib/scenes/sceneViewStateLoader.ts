import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { FrameDecoder } from '../mappers';
import { DEFAULT_TIMEOUT_IN_MS } from '../stream/dispatcher';
import { SceneViewStateIdentifier } from '../types';
import { ApplySceneViewStateOptions, SceneViewStateFeature } from '.';
import { CameraRenderResult } from './cameraRenderResult';
import {
  buildSceneViewStateIdentifier,
  toPbSceneViewStateFeatures,
} from './mapper';

export class SceneViewStateLoader {
  public constructor(
    private stream: StreamApi,
    private decodeFrame: FrameDecoder,
    public readonly sceneId: UUID.UUID,
    public readonly sceneViewId: UUID.UUID
  ) {}

  public async applySceneViewState(
    sceneViewStateId:
      | UUID.UUID
      | SceneViewStateIdentifier.SceneViewStateIdentifier,
    opts: ApplySceneViewStateOptions = {}
  ): Promise<vertexvis.protobuf.stream.ILoadSceneViewStateResult | undefined> {
    const pbIdField = buildSceneViewStateIdentifier(sceneViewStateId);

    await this.animateToSceneViewState(pbIdField, opts);

    return await this.stream.loadSceneViewState(
      {
        ...pbIdField,
        frameCorrelationId: opts.suppliedCorrelationId
          ? { value: opts.suppliedCorrelationId }
          : undefined,
      },
      true
    );
  }

  public async applyPartialSceneViewState(
    sceneViewStateId:
      | UUID.UUID
      | SceneViewStateIdentifier.SceneViewStateIdentifier,
    featuresToApply: SceneViewStateFeature[],
    opts: ApplySceneViewStateOptions = {}
  ): Promise<vertexvis.protobuf.stream.ILoadSceneViewStateResult | undefined> {
    const pbIdField = buildSceneViewStateIdentifier(sceneViewStateId);
    const pbFeatures = toPbSceneViewStateFeatures(featuresToApply);

    if (featuresToApply.includes('camera')) {
      await this.animateToSceneViewState(pbIdField, opts);
    }

    return await this.stream.loadSceneViewState(
      {
        ...pbIdField,
        frameCorrelationId: opts.suppliedCorrelationId
          ? { value: opts.suppliedCorrelationId }
          : undefined,
        sceneViewStateFeatureSubset: pbFeatures,
      },
      true
    );
  }

  private async animateToSceneViewState(
    identifier:
      | Pick<
          vertexvis.protobuf.stream.ILoadSceneViewStatePayload,
          'sceneViewStateId'
        >
      | Pick<
          vertexvis.protobuf.stream.ILoadSceneViewStatePayload,
          'sceneViewStateSuppliedId'
        >,
    opts: ApplySceneViewStateOptions
  ): Promise<void> {
    if (opts.animation != null) {
      const corrId = UUID.create();

      const flyToResult = await this.stream.flyTo(
        {
          sceneViewStateIdentifier: identifier,
          animation: {
            duration: toProtoDuration(opts.animation.milliseconds),
          },
          frameCorrelationId: {
            value: corrId,
          },
        },
        true
      );

      if (opts.waitForAnimation == null || opts.waitForAnimation) {
        const renderResult = new CameraRenderResult(
          this.stream,
          this.decodeFrame,
          {
            animationId: flyToResult.flyTo?.animationId?.hex ?? undefined,
            correlationId: corrId,
          },
          opts.animation.milliseconds + DEFAULT_TIMEOUT_IN_MS
        );

        await renderResult.onAnimationCompleted.once();
      }
    }
  }
}
