import { UUID, Uri, Color } from '@vertexvis/utils';
import { CommandContext, Command } from './command';
import { Disposable } from '../utils';
import { Dimensions, BoundingBox } from '@vertexvis/geometry';
import {
  FrameResponse,
  AnimationEasing,
  ImageStreamingClient,
} from '../image-streaming-client';
import { CommandRegistry } from './commandRegistry';
import { Camera } from '@vertexvis/graphics3d';
import { Model } from '../types';
import { Files, SceneStates } from '@vertexvis/vertex-api';
import { UrlDescriptor } from '../websocket-client';

export interface ConnectOptions {
  backgroundColor?: Color.Color;
}

export interface LoadModelResponse {
  frameResponse: FrameResponse;
  sceneStateId: UUID.UUID;
}

export function connect({
  backgroundColor = Color.create(255, 255, 255),
}: ConnectOptions = {}): Command<Promise<Disposable>, ImageStreamingClient> {
  return ({ stream, config, credentialsProvider }) => {
    const streamId = UUID.create();

    const urlProvider = (): UrlDescriptor => {
      const credentials = credentialsProvider();
      const renderingParams: object = {
        token:
          credentials?.strategy === 'bearer' ||
          credentials?.strategy === 'oauth2'
            ? credentials.token
            : undefined,
        // eslint-disable-next-line
        api_key:
          credentials?.strategy === 'api-key' ? credentials.token : undefined,
        'retry.timeout': false,
        'retry.partial': true,
        'retry.timeout.simulationrate': 0,
        'message-versioning': true,
        'rendering.tracing': false,
        'rendering.jpeg': Color.isOpaque(backgroundColor),
        'rendering.backgroundcolor': Color.toHexString(backgroundColor),
        'rendering.triad': false,
        // TODO (jeff): enable periodic rebalance when feature flag is removed
        // 'reconnect.periodic-rebalance': true,
      };

      const uri = Uri.addQueryParams(
        renderingParams,
        Uri.appendPath(
          `/stream/${streamId}`,
          Uri.parse(config.network.renderingHost)
        )
      );

      return { url: Uri.toString(uri) };
    };

    return stream.connect(urlProvider);
  };
}

export function loadModel(
  urn: string,
  dimensions: Dimensions.Dimensions
): Command<Promise<LoadModelResponse>, ImageStreamingClient> {
  return async ({
    stream,
    httpClient,
  }: CommandContext<ImageStreamingClient>) => {
    let model = Model.fromEedcUrn(urn);

    if (model.type === 'file') {
      let fileId = model.fileId;
      if (fileId == null && model.externalFileId != null) {
        const file = await Files.getFile(httpClient, {
          externalId: model.externalFileId,
        });
        fileId = file.id;
      }

      if (fileId == null) {
        throw new Error('Cannot load model. File ID is undefined');
      }

      const sceneState = await SceneStates.getForUserAndFile(
        httpClient,
        fileId
      );

      const clonedSceneState = await SceneStates.clone(
        httpClient,
        sceneState.id
      );

      model = {
        type: 'scenestate',
        sceneStateId: clonedSceneState.id,
      };
    }

    const data = { ...model, dimensions };
    const frameResponse = await stream.loadSceneState(data);
    return {
      sceneStateId: model.sceneStateId,
      frameResponse,
    };
  };
}

export function replaceCamera(
  camera: Camera.Camera
): Command<Promise<FrameResponse>, ImageStreamingClient> {
  return ({ stream }: CommandContext<ImageStreamingClient>) => {
    return stream.replaceCamera(camera);
  };
}

export function flyToCamera(
  camera: Camera.Camera,
  bounds: BoundingBox.BoundingBox,
  durationInMs = 500,
  easing: AnimationEasing = 'ease-out-cubic'
): Command<Promise<FrameResponse>, ImageStreamingClient> {
  return ({ stream }: CommandContext<ImageStreamingClient>) => {
    return stream.flyToCamera(camera, bounds, durationInMs, easing);
  };
}

export function resizeStream(
  dimensions: Dimensions.Dimensions
): Command<Promise<FrameResponse>, ImageStreamingClient> {
  return ({ stream }: CommandContext<ImageStreamingClient>) => {
    return stream.resizeStream(dimensions);
  };
}

export function registerCommands(commands: CommandRegistry): void {
  commands.register('stream.connect', connect);
  commands.register('stream.load-model', loadModel);
  commands.register('stream.replace-camera', replaceCamera);
  commands.register('stream.fly-to-camera', flyToCamera);
  commands.register('stream.resize-stream', resizeStream);
}
