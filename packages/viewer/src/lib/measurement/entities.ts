import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Vector3 } from '@vertexvis/geometry';
import { Vector3f } from '@vertexvis/scene-view-protos/core/protos/geometry_pb';
import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';
import { MeasureEntity } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Mapper } from '@vertexvis/utils';

import { fromPbVector3f } from '../mappers';

export class MeasurementEntity {
  public constructor(
    public readonly point: Vector3.Vector3,
    public readonly modelEntity: Uint8Array
  ) {}

  public static fromHit(
    hit: vertexvis.protobuf.stream.IHit
  ): MeasurementEntity {
    if (hit.hitPoint != null && hit.modelEntity != null) {
      const hitPoint = Mapper.ifInvalidThrow(fromPbVector3f)(hit.hitPoint);
      const modelEntity = vertexvis.protobuf.core.ModelEntity.encode(
        hit.modelEntity
      ).finish();
      return new MeasurementEntity(hitPoint, modelEntity);
    } else {
      throw new Error(
        'Cannot create MeasurementEntity from Hit. Hit is missing hit point and model entity'
      );
    }
  }

  public toProto(): MeasureEntity {
    const entity = new MeasureEntity();

    const point = new Vector3f();
    point.setX(this.point.x);
    point.setY(this.point.y);
    point.setZ(this.point.z);
    entity.setPoint(point);

    const modelEntity = ModelEntity.deserializeBinary(this.modelEntity);
    entity.setModelEntity(modelEntity);

    return entity;
  }
}
