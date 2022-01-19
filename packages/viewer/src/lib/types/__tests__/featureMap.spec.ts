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
      expect(featureMap.getEntityType(Point.create(1, 0))).toEqual(
        EntityType.CROSS_SECTION
      );

      expect(featureMap.getEntityType(Point.create(1, 1))).toEqual(
        EntityType.GENERIC_GEOMETRY
      );

      expect(featureMap.getEntityType(Point.create(1, 2))).toEqual(
        EntityType.IMPRECISE_EDGE
      );

      expect(featureMap.getEntityType(Point.create(1, 3))).toEqual(
        EntityType.IMPRECISE_SURFACE
      );

      expect(featureMap.getEntityType(Point.create(1, 4))).toEqual(
        EntityType.PRECISE_EDGE
      );

      expect(featureMap.getEntityType(Point.create(1, 5))).toEqual(
        EntityType.PRECISE_SURFACE
      );

      expect(featureMap.getEntityType(Point.create(1, 6))).toBeUndefined();
    });
  });
});
