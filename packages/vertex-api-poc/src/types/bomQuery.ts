import { HitsByPixelBody } from '../endpoints/hitDetection';

export enum BomItemQueryType {
  NONE = 'NONE',
  NAME = 'NAME',
  ALL_BY_NAME = 'ALL_BY_NAME',
  METADATA = 'METADATA',
  PART_ID = 'PART_ID',
}

export enum RestBomItemQueryType {
  POSITION = 'POSITION',
}

interface ValueBomItemQuery {
  bomItemQueryType:
    | BomItemQueryType.NONE
    | BomItemQueryType.NAME
    | BomItemQueryType.ALL_BY_NAME
    | BomItemQueryType.PART_ID;
  value: string;
}

interface KeyValueBomItemQuery {
  bomItemQueryType: BomItemQueryType.METADATA;
  key?: string;
  value: string;
}

interface PositionBomItemQuery {
  bomItemQueryType: RestBomItemQueryType.POSITION;
  hitRequestBody: HitsByPixelBody;
}

export type BomItemQuery =
  | ValueBomItemQuery
  | KeyValueBomItemQuery
  | PositionBomItemQuery;
