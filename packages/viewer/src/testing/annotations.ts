import { Vector3f } from '@vertexvis/scene-view-protos/core/protos/geometry_pb';
import {
  CalloutAnnotationData,
  CustomAnnotationData,
  SceneAnnotation,
  SceneAnnotationData,
  SceneAnnotationSet,
} from '@vertexvis/scene-view-protos/core/protos/scene_annotations_pb';
import {
  CreateSceneViewAnnotationSetResponse,
  DeleteSceneViewAnnotationSetResponse,
  ListSceneAnnotationsResponse,
  ListSceneViewAnnotationSetsResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { UUID } from '@vertexvis/utils';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';

import { AnnotationData } from '../lib/annotations/annotation';
import { random } from './random';
import { makeTimestamp, makeUuid2l } from './sceneView';

export function makeSceneAnnotationSet({
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
  set.setId(makeUuid2l(id));
  set.setCreatedAt(makeTimestamp(createdAt));
  set.setModifiedAt(makeTimestamp(modifiedAt));

  const nameValue = new StringValue();
  nameValue.setValue(name);
  set.setName(nameValue);

  const suppliedIdValue = new StringValue();
  suppliedIdValue.setValue(suppliedId);
  set.setSuppliedId(suppliedIdValue);

  return set;
}

export function makeCreateSceneViewAnnotationSetResponse(): CreateSceneViewAnnotationSetResponse {
  return new CreateSceneViewAnnotationSetResponse();
}

export function makeDeleteSceneViewAnnotationSetResponse(): DeleteSceneViewAnnotationSetResponse {
  return new DeleteSceneViewAnnotationSetResponse();
}

export function makeListSceneViewAnnotationSetsResponse(
  annotationSets: SceneAnnotationSet[] = [
    makeSceneAnnotationSet(),
    makeSceneAnnotationSet(),
  ]
): ListSceneViewAnnotationSetsResponse {
  const res = new ListSceneViewAnnotationSetsResponse();
  res.setSceneAnnotationSetsList(annotationSets);
  return res;
}

export function makeListSceneAnnotationsResponse(
  annotations: SceneAnnotation[] = [
    makeSceneAnnotation(),
    makeSceneAnnotation(),
  ]
): ListSceneAnnotationsResponse {
  const res = new ListSceneAnnotationsResponse();
  res.setSceneAnnotationsList(annotations);
  return res;
}

export function makeSceneAnnotation({
  id = UUID.create(),
  createdAt = new Date(),
  modifiedAt = new Date(),
  suppliedId = random.string(),
  data = { type: 'custom', jsonType: random.string(), jsonData: {} },
}: {
  id?: UUID.UUID;
  createdAt?: Date;
  modifiedAt?: Date;
  suppliedId?: string;
  data?: AnnotationData;
} = {}): SceneAnnotation {
  const ann = new SceneAnnotation();
  ann.setId(makeUuid2l(id));
  ann.setCreatedAt(makeTimestamp(createdAt));
  ann.setModifiedAt(makeTimestamp(modifiedAt));

  const suppliedIdValue = new StringValue();
  suppliedIdValue.setValue(suppliedId);
  ann.setSuppliedId(suppliedIdValue);

  const dataValue = new SceneAnnotationData();

  if (data.type === 'callout') {
    const callout = new CalloutAnnotationData();

    const position = new Vector3f();
    position.setX(data.position.x);
    position.setY(data.position.y);
    position.setZ(data.position.z);
    callout.setPosition(position);

    if (data.icon != null) {
      const icon = new StringValue();
      icon.setValue(data.icon);
      callout.setIcon(icon);
    }

    if (data.primaryColor != null) {
      const primaryColor = new StringValue();
      primaryColor.setValue(data.primaryColor);
      callout.setPrimaryColor(primaryColor);
    }

    if (data.accentColor != null) {
      const accentColor = new StringValue();
      accentColor.setValue(data.accentColor);
      callout.setAccentColor(accentColor);
    }

    dataValue.setCallout(callout);
  } else if (data.type === 'custom') {
    const custom = new CustomAnnotationData();
    custom.setType(data.jsonType);
    custom.setJsonData(JSON.stringify(data.jsonData));
    dataValue.setCustomJson(custom);
  }

  ann.setData(dataValue);

  return ann;
}
