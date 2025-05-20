import { Cursor } from '@vertexvis/scene-view-protos/core/protos/paging_pb';
import {
  PropertyCategoryMap,
  PropertyEntry,
  PropertyKey,
  PropertyValue,
  PropertyValueDate,
  PropertyValueDouble,
  PropertyValueLong,
  PropertyValueString,
} from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import { ListSceneItemMetadataResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

export class ListSceneItemMetadataResponseBuilder {
  private response: ListSceneItemMetadataResponse;

  public constructor() {
    this.response = new ListSceneItemMetadataResponse();
  }

  public withCursor(cursorValue: string): ListSceneItemMetadataResponseBuilder {
    const cursor = new Cursor();
    cursor.setNext(cursorValue);
    this.response.setCursor(cursor);
    return this;
  }

  public withProperties(
    properties: PropertyEntry[]
  ): ListSceneItemMetadataResponseBuilder {
    this.response.setEntriesList(properties);
    return this;
  }

  public build(): ListSceneItemMetadataResponse {
    return this.response;
  }
}

export class PropertyEntryBuilder {
  private entry: PropertyEntry;

  public constructor() {
    this.entry = new PropertyEntry();
  }

  public withId(id: string): PropertyEntryBuilder {
    this.entry.setId(id);
    return this;
  }

  public withKey(key: PropertyKey): PropertyEntryBuilder {
    this.entry.setKey(key);
    return this;
  }

  public withValue(value: PropertyValue): PropertyEntryBuilder {
    this.entry.setValue(value);
    return this;
  }

  public build(): PropertyEntry {
    return this.entry;
  }
}

export class PropertyKeyBuilder {
  private key: PropertyKey;

  public constructor() {
    this.key = new PropertyKey();
  }

  public withName(name: string): PropertyKeyBuilder {
    this.key.setName(name);
    return this;
  }

  public withCategory(
    value: PropertyCategoryMap[keyof PropertyCategoryMap]
  ): PropertyKeyBuilder {
    this.key.setCategory(value);
    return this;
  }

  public build(): PropertyKey {
    return this.key;
  }
}

export class PropertyValueBuilder {
  private value: PropertyValue;

  public constructor() {
    this.value = new PropertyValue();
  }

  public withString(value: string): PropertyValueBuilder {
    const valueString = new PropertyValueString();
    valueString.setValue(value);
    this.value.setString(valueString);
    return this;
  }

  public withLong(value: number): PropertyValueBuilder {
    const valueLong = new PropertyValueLong();
    valueLong.setValue(value);
    this.value.setLong(valueLong);
    return this;
  }

  public withDouble(value: number): PropertyValueBuilder {
    const valueDouble = new PropertyValueDouble();
    valueDouble.setValue(value);
    this.value.setDouble(valueDouble);
    return this;
  }

  public withDate(value: Timestamp): PropertyValueBuilder {
    const valueDate = new PropertyValueDate();
    valueDate.setValue(value);
    this.value.setDate(valueDate);
    return this;
  }

  public build(): PropertyValue {
    return this.value;
  }
}
