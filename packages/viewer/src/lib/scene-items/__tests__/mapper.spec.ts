import { PropertyCategory } from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import { ListSceneItemMetadataResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

import {
  ListSceneItemMetadataResponseBuilder,
  PropertyEntryBuilder,
  PropertyKeyBuilder,
  PropertyValueBuilder,
} from '../../../testing/scene-items-helper';
import { mapListSceneItemMetadataResponseOrThrow } from '../mapper';
import { SceneItemMetadataResponse } from '../types';

const CURSOR_VALUE = 'next';
const UNDEFINED_CURSOR = '';

describe('ListSceneItemMetadataResponse', () => {
  it('paging next cursor', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withCursor(CURSOR_VALUE)
          .build()
      )
    ).toEqual({
      paging: {
        next: CURSOR_VALUE,
      },
      entries: [],
    });
  });

  it('paging cursor undefined', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withCursor(UNDEFINED_CURSOR)
          .build()
      )
    ).toEqual({
      paging: {
        next: UNDEFINED_CURSOR,
      },
      entries: [],
    });
  });

  it('entries id', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder().withId('random-id').build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
        },
      ],
    });
  });

  it('entries id', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder().withId('random-id').build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
        },
      ],
    });
  });

  it('entries key', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder()
              .withId('random-id')
              .withKey(new PropertyKeyBuilder().withName('name').build())
              .build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
          key: {
            name: 'name',
            category: PropertyCategory.PROPERTY_CATEGORY_INVALID,
          },
        },
      ],
    });
  });

  it.each([
    { category: PropertyCategory.PROPERTY_CATEGORY_INVALID },
    { category: PropertyCategory.PROPERTY_CATEGORY_USER },
    { category: PropertyCategory.PROPERTY_CATEGORY_VERTEX },
    { category: PropertyCategory.PROPERTY_CATEGORY_VENDOR },
  ])(`entries key category $category`, ({ category }) => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder()
              .withId('random-id')
              .withKey(
                new PropertyKeyBuilder()
                  .withName('name')
                  .withCategory(category)
                  .build()
              )
              .build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
          key: {
            name: 'name',
            category,
          },
        },
      ],
    });
  });

  it('property value string', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder()
              .withId('random-id')
              .withValue(
                new PropertyValueBuilder().withString('string-value').build()
              )
              .build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
          value: {
            type: 'string',
            value: 'string-value',
          },
        },
      ],
    });
  });

  it('property value long', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder()
              .withId('random-id')
              .withValue(new PropertyValueBuilder().withLong(1).build())
              .build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
          value: {
            type: 'long',
            value: 1,
          },
        },
      ],
    });
  });

  it('property value double', () => {
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder()
              .withId('random-id')
              .withValue(new PropertyValueBuilder().withDouble(1).build())
              .build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
          value: {
            type: 'double',
            value: 1,
          },
        },
      ],
    });
  });

  it('property value date', () => {
    const timestamp = new Timestamp();
    timestamp.setSeconds(1);
    timestamp.setNanos(1);
    expect(
      validate(
        new ListSceneItemMetadataResponseBuilder()
          .withProperties([
            new PropertyEntryBuilder()
              .withId('random-id')
              .withValue(new PropertyValueBuilder().withDate(timestamp).build())
              .build(),
          ])
          .build()
      )
    ).toEqual({
      paging: {
        next: undefined,
      },
      entries: [
        {
          id: 'random-id',
          value: {
            type: 'timestamp',
            value: {
              seconds: 1,
              nanos: 1,
            },
          },
        },
      ],
    });
  });
});

const validate = (
  response: ListSceneItemMetadataResponse
): SceneItemMetadataResponse => {
  return mapListSceneItemMetadataResponseOrThrow(response.toObject());
};
