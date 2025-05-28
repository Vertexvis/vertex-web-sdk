import { PropertyCategory } from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import { ListSceneItemMetadataResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';

import { mockGrpcUnaryResult } from '../../../testing';
import { random } from '../../../testing/random';
import { SceneItemController } from '../controller';
import { mapListSceneItemMetadataResponseOrThrow } from '../mapper';
import { ListSceneItemMetadataResponseBuilder, PropertyEntryBuilder, PropertyKeyBuilder, PropertyValueBuilder } from '../../../testing/scene-items-helper';

function buildListSceneItemMetadataResponse(): ListSceneItemMetadataResponse {
  return new ListSceneItemMetadataResponseBuilder()
    .withCursor('cursor')
    .withProperties([
      new PropertyEntryBuilder()
        .withId(random.string())
        .withKey(
          new PropertyKeyBuilder()
            .withName(random.string())
            .withCategory(PropertyCategory.PROPERTY_CATEGORY_USER)
            .build()
        )
        .withValue(
          new PropertyValueBuilder().withString(random.string()).build()
        )
        .build(),
    ])
    .build();
}

describe(SceneItemController, () => {
  const jwt = random.string();
  const deviceId = random.string();
  const res = buildListSceneItemMetadataResponse();

  const api = {
    listSceneItemMetadata: mockGrpcUnaryResult(res),
  };

  const controller = new SceneItemController(
    api as unknown as SceneViewAPIClient,
    () => jwt,
    () => deviceId
  );

  it('listSceneItemMetadata', async () => {
    expect(await controller.listSceneItemMetadata(UUID.create(), {})).toEqual(
      mapListSceneItemMetadataResponseOrThrow(res.toObject())
    );
  });
});
