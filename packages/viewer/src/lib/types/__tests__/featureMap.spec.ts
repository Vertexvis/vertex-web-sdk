import { Point } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

import { makeFeatureMap } from '../../../testing/fixtures';
import { EntityType } from '../entities';
import { FeatureMap } from '../featureMap';

describe(FeatureMap, () => {
  describe(FeatureMap.prototype.getEntityType, () => {
    const featureMap = makeFeatureMap(10, 10, ({ y }) => {
      if (y === 0) {
        return Color.create(0, 0, 0, EntityType.CROSS_SECTION);
      } else if (y === 1) {
        return Color.create(0, 0, 0, EntityType.GENERIC_GEOMETRY);
      } else if (y === 2) {
        return Color.create(0, 0, 0, EntityType.IMPRECISE_EDGE);
      } else if (y === 3) {
        return Color.create(0, 0, 0, EntityType.IMPRECISE_SURFACE);
      } else if (y === 4) {
        return Color.create(0, 0, 0, EntityType.PRECISE_EDGE);
      } else if (y === 5) {
        return Color.create(0, 0, 0, EntityType.PRECISE_SURFACE);
      } else {
        return Color.create(0, 0, 0, 0);
      }
    });

    it('should return the correct entity type', () => {
      let type = featureMap.getEntityType(Point.create(1, 0));
      expect(type).toEqual(EntityType.CROSS_SECTION);

      type = featureMap.getEntityType(Point.create(1, 1));
      expect(type).toEqual(EntityType.GENERIC_GEOMETRY);

      type = featureMap.getEntityType(Point.create(1, 2));
      expect(type).toEqual(EntityType.IMPRECISE_EDGE);

      type = featureMap.getEntityType(Point.create(1, 3));
      expect(type).toEqual(EntityType.IMPRECISE_SURFACE);

      type = featureMap.getEntityType(Point.create(1, 4));
      expect(type).toEqual(EntityType.PRECISE_EDGE);

      type = featureMap.getEntityType(Point.create(1, 5));
      expect(type).toEqual(EntityType.PRECISE_SURFACE);

      type = featureMap.getEntityType(Point.create(1, 6));
      expect(type).toBeUndefined();
    });
  });
});
