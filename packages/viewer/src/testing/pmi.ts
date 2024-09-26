import { PmiAnnotation } from '@vertexvis/scene-view-protos/core/protos/model_views_pb';
import { ListPmiAnnotationsResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { UUID } from '@vertexvis/utils';

import { random } from './random';
import { makeUuid2l } from './sceneView';

export function makeListPmiAnnotationsResponse(
  annotations: PmiAnnotation[] = [makeAnnotation(), makeAnnotation()]
): ListPmiAnnotationsResponse {
  const res = new ListPmiAnnotationsResponse();
  res.setAnnotationsList(annotations);
  return res;
}

export function makeAnnotation(
  id: UUID.UUID = UUID.create(),
  displayName: string = random.string()
): PmiAnnotation {
  const annotation = new PmiAnnotation();
  annotation.setId(makeUuid2l(id));
  annotation.setDisplayName(displayName);
  return annotation;
}
