import {
  PropertyEntry,
  PropertyKey,
  PropertyValue,
  PropertyValueDate,
  PropertyValueDouble,
  PropertyValueLong,
  SceneItemOverride as PBSceneItemOverride,
  SceneViewItem as PBSceneViewItem,
} from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import {
  GetSceneViewItemResponse,
  ListSceneItemMetadataResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Mapper as M } from '@vertexvis/utils';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';

import {
  fromPbBoolValue,
  fromPbBoundingBox3f,
  fromPbInstant,
  fromPbMatrix4f,
  fromPbStringValue,
  fromPbUuid2l,
  mapCursor,
} from '../mappers';
import { fromPbMaterialOverride } from '../mappers/colorMaterial';
import {
  DomainPropertyEntry,
  DomainPropertyKey,
  DomainPropertyValue,
  SceneItemMetadataResponse,
  SceneViewItem,
  SceneViewItemOverride,
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

const mapListSceneItemMetadataResponse: M.Func<
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
  mapListSceneItemMetadataResponse
);

const mapSceneViewItemOverride: M.Func<
  PBSceneItemOverride.AsObject,
  SceneViewItemOverride
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('id', fromPbUuid2l),
    M.mapRequiredProp('createdAt', fromPbInstant),
    M.mapProp('materialOverride', M.ifDefined(fromPbMaterialOverride)),
    M.mapProp('transform', M.ifDefined(fromPbMatrix4f)),
    M.mapProp('isVisible', M.ifDefined(fromPbBoolValue)),
    M.mapProp('isSelected', M.ifDefined(fromPbBoolValue)),
    M.mapProp('isPhantom', M.ifDefined(fromPbBoolValue)),
    M.mapProp('endItem', M.ifDefined(fromPbBoolValue))
  ),
  ([
    id,
    createdAt,
    materialOverride,
    transform,
    isVisible,
    isSelected,
    isPhantom,
    endItem,
  ]) => ({
    id,
    createdAt,
    materialOverride,
    transform,
    isVisible,
    isSelected,
    isPhantom,
    endItem,
  })
);

export const mapSceneViewItem: M.Func<PBSceneViewItem.AsObject, SceneViewItem> =
  M.defineMapper(
    M.read(
      M.mapRequiredProp('id', fromPbUuid2l),
      M.mapRequiredProp('createdAt', fromPbInstant),
      M.mapRequiredProp('name', fromPbStringValue),
      M.mapProp('parentId', M.ifDefined(fromPbUuid2l)),
      M.mapProp('suppliedId', M.ifDefined(fromPbStringValue)),
      M.mapProp('boundingBox', M.ifDefined(fromPbBoundingBox3f)),
      M.mapProp('worldTransform', M.ifDefined(fromPbMatrix4f)),
      M.mapProp('override', M.ifDefined(mapSceneViewItemOverride))
    ),
    ([
      id,
      createdAt,
      name,
      parentId,
      suppliedId,
      boundingBox,
      worldTransform,
      override,
    ]) => ({
      id,
      createdAt,
      name,
      parentId: parentId ?? undefined,
      suppliedId,
      boundingBox,
      worldTransform,
      override,
    })
  );

export const mapGetSceneViewItemResponseOrThrow: M.ThrowIfInvalidFunc<
  GetSceneViewItemResponse.AsObject,
  SceneViewItem | undefined
> = M.ifInvalidThrow(
  M.defineMapper(
    M.read(M.mapProp('item', M.ifDefined(mapSceneViewItem))),
    ([item]) => item ?? undefined
  )
);
