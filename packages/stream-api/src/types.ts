import { DeepRequired } from '@vertexvis/utils';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

export type StartStreamPayload = DeepRequired<
  vertexvis.protobuf.stream.IStartStreamPayload,
  ['frameCorrelationId']
>;

export type ReconnectPayload = DeepRequired<
  vertexvis.protobuf.stream.IReconnectPayload,
  ['frameCorrelationId']
>;

export type ReplaceCameraPayload = DeepRequired<
  vertexvis.protobuf.stream.IUpdateCameraPayload,
  ['frameCorrelationId']
>;

export type HitItemsPayload = DeepRequired<
  vertexvis.protobuf.stream.IHitItemsPayload,
  []
>;
