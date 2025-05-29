import {
  PropertyEntry,
  PropertyKey,
  PropertyValue,
  PropertyValueDate,
  PropertyValueDouble,
  PropertyValueLong,
} from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import { ListSceneItemMetadataResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Mapper as M } from '@vertexvis/utils';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';

import { mapCursor } from '../mappers';
import {
  DomainPropertyKey,
  DomainPropertyValue,
  SceneItemMetadataResponse,
} from './types';

const mapPropertyKey: M.Func<
  PropertyKey.AsObject,
  DomainPropertyKey | null | undefined
> = M.defineMapper(
  M.read(M.requiredProp('name'), M.requiredProp('category')),
  ([name, category]) => ({ name, category })
);

const mapGetStringValue: M.Func<StringValue.AsObject, DomainPropertyValue> =
  M.defineMapper(M.read(M.getProp('value')), ([value]) => ({
    type: 'string',
    value,
  }));

const mapStringValue: M.Func<
  PropertyValue.AsObject,
  DomainPropertyValue | null | undefined
> = M.mapProp('string', M.ifDefined(mapGetStringValue));

const mapGetLongValue: M.Func<PropertyValueLong.AsObject, DomainPropertyValue> =
  M.defineMapper(M.read(M.getProp('value')), ([value]) => ({
    type: 'long',
    value,
  }));

const mapLongValue: M.Func<
  PropertyValue.AsObject,
  DomainPropertyValue | null | undefined
> = M.mapProp('pb_long', M.ifDefined(mapGetLongValue));

const mapGetDoubleValue: M.Func<
  PropertyValueDouble.AsObject,
  DomainPropertyValue
> = M.defineMapper(M.read(M.getProp('value')), ([value]) => ({
  type: 'double',
  value,
}));

const mapDoubleValue: M.Func<
  PropertyValue.AsObject,
  DomainPropertyValue | null | undefined
> = M.mapProp('pb_double', M.ifDefined(mapGetDoubleValue));

const mapGetTimestampValue: M.Func<
  PropertyValueDate.AsObject,
  DomainPropertyValue
> = M.defineMapper(M.read(M.requiredProp('value')), ([value]) => ({
  type: 'timestamp',
  value: value,
}));

const mapTimestampValue: M.Func<
  PropertyValue.AsObject,
  DomainPropertyValue | null | undefined
> = M.mapProp('date', M.ifDefined(mapGetTimestampValue));

const mapPropertyValue: M.Func<
  PropertyValue.AsObject,
  DomainPropertyValue | null | undefined
> = M.compose(
  M.pickFirst(mapStringValue, mapLongValue, mapDoubleValue, mapTimestampValue),
  M.required('value')
);

const mapEntriesList: M.Func<PropertyEntry.AsObject, DomainPropertyEntry> =
  M.defineMapper(
    M.read(
      M.requiredProp('id'),
      M.mapProp('key', M.ifDefined(mapPropertyKey)),
      M.mapProp('value', M.ifDefined(mapPropertyValue))
    ),
    ([id, key, value]) => ({ id, key, value })
  );

const mapListSceneItemMetadataResposne: M.Func<
  ListSceneItemMetadataResponse.AsObject,
  SceneItemMetadataResponse
> = M.defineMapper(
  M.read(
    M.mapProp('cursor', mapCursor),
    M.mapRequiredProp('entriesList', M.mapArray(mapEntriesList))
  ),
  ([cursor, entries]) => ({
    paging: {
      next: cursor,
    },
    entries,
  })
);

export const mapListSceneItemMetadataResponseOrThrow = M.ifInvalidThrow(
  mapListSceneItemMetadataResposne
);
