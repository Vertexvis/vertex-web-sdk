import { EedcFrameAttributes } from './frameAttributes';
import { BinaryReader } from '@vertexvis/utils';

export interface FrameResponse {
  type: 'frame';
  frame: Frame;
}

export interface Frame {
  imageBytes: Int8Array;
  frameAttributes: EedcFrameAttributes;
}

export interface MetaBufferResponse {
  type: 'metabuffer';
  imageBytes: ArrayBuffer;
}

export interface JsonResponse {
  type: 'json';
  json: Record<string, string>;
}

export type BinaryResponse = FrameResponse | MetaBufferResponse;

export type Response = BinaryResponse | JsonResponse;

export function parseResponse({ data }: MessageEvent): Response {
  if (data instanceof ArrayBuffer) {
    return parseBinaryResponse(data);
  } else {
    return parseJsonResponse(data);
  }
}

function parseBinaryResponse(data: ArrayBuffer): BinaryResponse {
  const reader = BinaryReader.fromArrayBuffer(data);
  const versionLength = BinaryReader.readInt32(reader);
  const version = BinaryReader.readUtf8String(
    versionLength.value,
    versionLength
  );
  const typeLength = BinaryReader.readInt32(version);
  const type = BinaryReader.readUtf8String(typeLength.value, typeLength);

  const payloadLength = BinaryReader.readInt32(type);
  const payload = BinaryReader.sliceInt8Array(
    payloadLength.value,
    payloadLength
  );

  switch (type.value) {
    case 'frame':
      return parseFrameResponse(payload.value.buffer);
    case 'meta-buffer':
      return parseMetaBufferResponse(payload.value.buffer);
    default:
      throw new Error(`Unhandled type ${type.value}`);
  }
}

function parseFrameResponse(data: ArrayBuffer): FrameResponse {
  const reader = BinaryReader.fromArrayBuffer(data);
  const frameAttributesLength = BinaryReader.readInt32(reader);
  const frameAttributes = BinaryReader.readUtf8String(
    frameAttributesLength.value,
    frameAttributesLength
  );

  const imageLength = BinaryReader.readInt32(frameAttributes);
  const imageBytes = BinaryReader.readInt8Array(imageLength.value, imageLength);

  return {
    type: 'frame',
    frame: {
      frameAttributes: JSON.parse(frameAttributes.value),
      imageBytes: imageBytes.value,
    },
  };
}

function parseMetaBufferResponse(data: ArrayBuffer): MetaBufferResponse {
  const reader = BinaryReader.fromArrayBuffer(data);
  const attributesLength = BinaryReader.readInt32(reader);
  const attributes = BinaryReader.readUtf8String(
    attributesLength.value,
    attributesLength
  );

  const imageLength = BinaryReader.readInt32(attributes);
  const imageBytes = BinaryReader.readInt8Array(imageLength.value, imageLength);

  return { type: 'metabuffer', imageBytes: imageBytes.value };
}

function parseJsonResponse(data: string): JsonResponse {
  return { type: 'json', json: JSON.parse(data) };
}
