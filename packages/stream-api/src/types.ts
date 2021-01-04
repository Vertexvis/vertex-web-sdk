import { DeepRequired, RequiredAndNonNullable } from '@vertexvis/utils';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

export type RequestMessage = RequiredAndNonNullable<
  Pick<vertexvis.protobuf.stream.IStreamMessage, 'request' | 'sentAtTime'>
>;

export type ResponseMessage = RequiredAndNonNullable<
  Pick<vertexvis.protobuf.stream.IStreamMessage, 'response' | 'sentAtTime'>
>;

export type StreamAttributes = vertexvis.protobuf.stream.IStreamAttributes;

export type StartStreamPayload = DeepRequired<
  vertexvis.protobuf.stream.IStartStreamPayload,
  ['frameCorrelationId'] | ['frameBackgroundColor'] | ['streamAttributes']
>;

export type ReconnectPayload = DeepRequired<
  vertexvis.protobuf.stream.IReconnectPayload,
  ['frameCorrelationId'] | ['frameBackgroundColor']
>;

export type UpdateStreamPayload = vertexvis.protobuf.stream.IUpdateStreamPayload;

export type ReplaceCameraPayload = DeepRequired<
  vertexvis.protobuf.stream.IUpdateCameraPayload,
  ['frameCorrelationId']
>;

export type UpdateDimensionsPayload = DeepRequired<
  vertexvis.protobuf.stream.IUpdateDimensionsPayload,
  ['frameCorrelationId']
>;

export type HitItemsPayload = DeepRequired<
  vertexvis.protobuf.stream.IHitItemsPayload,
  []
>;

export type DrawFramePayload = DeepRequired<
  vertexvis.protobuf.stream.IDrawFramePayload,
  []
>;

export type GracefulReconnectPayload = DeepRequired<
  vertexvis.protobuf.stream.IGracefulReconnectionPayload,
  []
>;

export type SyncTimePayload = DeepRequired<
  vertexvis.protobuf.stream.ISyncTimePayload,
  []
>;

export type RecordPerformancePayload = DeepRequired<
  vertexvis.protobuf.stream.IRecordPerformancePayload,
  []
>;

export type DrawFrameResult = DeepRequired<
  Pick<vertexvis.protobuf.stream.IStreamResponse, 'drawFrame'>,
  | ['drawFrame', 'timing', 'receiveToPaintDuration']
  | ['drawFrame', 'timing', 'sendToReceiveDuration']
>;

export type ResponseResult = DrawFrameResult;

export type ResponseError = vertexvis.protobuf.stream.IError;
