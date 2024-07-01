import { UUID } from '@vertexvis/utils';

import { random } from '../../../testing';
import {
  makeSceneAnnotation,
  makeSceneAnnotationSet,
} from '../../../testing/annotations';
import { CustomAnnotationData } from '../../annotations/annotation';
import { fromPbAnnotation, fromPbAnnotationSet } from '../annotation';

describe(fromPbAnnotationSet, () => {
  it('returns mapped annotation set', () => {
    const id = UUID.create();
    const createdAt = new Date();
    const modifiedAt = new Date();
    const name = random.string();
    const suppliedId = random.string();

    const pb = makeSceneAnnotationSet({
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
    const data = {
      type: 'custom',
      jsonType: random.string(),
      jsonData: {},
    } as CustomAnnotationData;

    const pb = makeSceneAnnotation({
      id,
      createdAt,
      modifiedAt,
      suppliedId,
      data,
    });

    const actual = fromPbAnnotation(pb);

    expect(actual).toMatchObject({
      id,
      createdAt,
      modifiedAt,
      suppliedId,
      data: {
        type: 'custom',
        jsonType: data.jsonType,
        jsonData: data.jsonData,
      },
    });
  });
});
