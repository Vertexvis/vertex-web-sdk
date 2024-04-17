import {
  SceneAnnotation,
  SceneAnnotationData,
  SceneAnnotationSet,
} from '@vertexvis/scene-view-protos/core/protos/scene_annotations_pb';
import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import {
  CreateSceneViewAnnotationSetResponse,
  DeleteSceneViewAnnotationSetResponse,
  ListSceneAnnotationsResponse,
  ListSceneViewAnnotationSetsResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { toProtoTimestamp } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';

import { random } from './random';

export function createSceneAnnotationSet({
  id = UUID.create(),
  createdAt = new Date(),
  modifiedAt = new Date(),
  name = random.string(),
  suppliedId = random.string(),
}: {
  id?: UUID.UUID;
  createdAt?: Date;
  modifiedAt?: Date;
  suppliedId?: string;
  name?: string;
} = {}): SceneAnnotationSet {
  const set = new SceneAnnotationSet();
  set.setId(createUuid2l(id));
  set.setCreatedAt(createTimestamp(createdAt));
  set.setModifiedAt(createTimestamp(modifiedAt));

  const nameValue = new StringValue();
  nameValue.setValue(name);
  set.setName(nameValue);

  const suppliedIdValue = new StringValue();
  suppliedIdValue.setValue(suppliedId);
  set.setSuppliedId(suppliedIdValue);

  return set;
}

export function createCreateSceneViewAnnotationSetResponse(): CreateSceneViewAnnotationSetResponse {
  return new CreateSceneViewAnnotationSetResponse();
}

export function createDeleteSceneViewAnnotationSetResponse(): DeleteSceneViewAnnotationSetResponse {
  return new DeleteSceneViewAnnotationSetResponse();
}

export function createListSceneViewAnnotationSetsResponse(
  annotationSets: SceneAnnotationSet[] = [
    createSceneAnnotationSet(),
    createSceneAnnotationSet(),
  ]
): ListSceneViewAnnotationSetsResponse {
  const res = new ListSceneViewAnnotationSetsResponse();
  res.setSceneAnnotationSetsList(annotationSets);
  return res;
}

export function createListSceneAnnotationsResponse(
  annotations: SceneAnnotation[] = [
    createSceneAnnotation(),
    createSceneAnnotation(),
  ]
): ListSceneAnnotationsResponse {
  const res = new ListSceneAnnotationsResponse();
  res.setSceneAnnotationsList(annotations);
  return res;
}

export function createSceneAnnotation({
  id = UUID.create(),
  createdAt = new Date(),
  modifiedAt = new Date(),
  suppliedId = random.string(),
  data = JSON.stringify({}),
}: {
  id?: UUID.UUID;
  createdAt?: Date;
  modifiedAt?: Date;
  suppliedId?: string;
  data?: string;
} = {}): SceneAnnotation {
  const ann = new SceneAnnotation();
  ann.setId(createUuid2l(id));
  ann.setCreatedAt(createTimestamp(createdAt));
  ann.setModifiedAt(createTimestamp(modifiedAt));

  const suppliedIdValue = new StringValue();
  suppliedIdValue.setValue(suppliedId);
  ann.setSuppliedId(suppliedIdValue);

  const dataValue = new SceneAnnotationData();
  dataValue.setJson(data);
  ann.setData(dataValue);

  return ann;
}

function createUuid2l(id: UUID.UUID = UUID.create()): Uuid2l {
  const msbLsb = UUID.toMsbLsb(id);
  const pb = new Uuid2l();
  pb.setMsb(msbLsb.msb);
  pb.setLsb(msbLsb.lsb);
  return pb;
}

function createTimestamp(date: Date = new Date()): Timestamp {
  const timestamp = toProtoTimestamp(date);
  const res = new Timestamp();

  if (typeof timestamp.seconds === 'number') {
    res.setSeconds(timestamp.seconds);
  } else {
    res.setSeconds(timestamp.seconds.toNumber());
  }

  res.setNanos(timestamp.nanos);
  return res;
}
