import { UUID } from '@vertexvis/utils';

import { random } from '../../../testing';
import {
  createSceneAnnotation,
  createSceneAnnotationSet,
} from '../../../testing/annotations';
import { fromPbAnnotation, fromPbAnnotationSet } from '../annotation';

describe(fromPbAnnotationSet, () => {
  it('returns mapped annotation set', () => {
    const id = UUID.create();
    const createdAt = new Date();
    const modifiedAt = new Date();
    const name = random.string();
    const suppliedId = random.string();

    const pb = createSceneAnnotationSet({
      id,
      createdAt,
      modifiedAt,
      name,
      suppliedId,
    });

    const actual = fromPbAnnotationSet(pb);

    expect(actual).toMatchObject({
      id,
      createdAt,
      modifiedAt,
      name,
      suppliedId,
    });
  });
});

describe(fromPbAnnotation, () => {
  it('returns mapped annotation set', () => {
    const id = UUID.create();
    const createdAt = new Date();
    const modifiedAt = new Date();
    const suppliedId = random.string();
    const data = JSON.stringify({ type: random.string() });

    const pb = createSceneAnnotation({
      id,
      createdAt,
      modifiedAt,
      suppliedId,
      data,
    });

    const actual = fromPbAnnotation(pb);

    expect(actual).toMatchObject({ id, createdAt, modifiedAt, suppliedId });
  });
});
