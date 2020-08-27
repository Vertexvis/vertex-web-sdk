import { createSceneAlteration } from '../streamCommands';
import { createFrameStreamingClientMock } from '../../testing';
import { defaultConfig, Config } from '../../config/config';
import { UUID } from '@vertexvis/utils';
import { QueryExpression } from '../../scenes/queries';
import { ItemOperation } from '../../scenes/operations';
import { fromHex } from '../../scenes/colorMaterial';
import { QueryOperation } from '../../scenes';

describe('streamCommands', () => {
  const stream = createFrameStreamingClientMock();
  const config = defaultConfig as Config;
  const suppliedId = 'some-suppliedId';
  const sceneItemId: UUID.UUID = UUID.create();
  const sceneViewId = UUID.create();

  const builtQueryForPart: QueryExpression = {
    type: 'and',
    expressions: [
      {
        type: 'supplied-id',
        value: suppliedId,
      },
      {
        type: 'item-id',
        value: sceneItemId.toString(),
      },
    ],
  };
  const operationsForShowAndChangeColor: ItemOperation[] = [
    {
      type: 'show',
    },
    {
      type: 'change-material',
      color: fromHex('#FF00AA'),
    },
  ];

  const expectedOperationResult = 
  {
    and: {
      queries: [
        { sceneItemQuery: { suppliedId: 'some-suppliedId' } },
        {
          sceneItemQuery: {
            id: { hex: sceneItemId.toString() },
          },
        },
      ],
    },
    operationTypes: [
      { changeVisibility: { visible: true } },
      {
        changeMaterial: {
          material: {
            d: 100,
            ka: { r: 0, g: 0, b: 0, a: 0 },
            kd: { a: 255, b: 170, g: 0, r: 255 },
            ke: { r: 0, g: 0, b: 0, a: 0 },
            ks: { r: 0, g: 0, b: 0, a: 0 },
            ns: 10,
          },
        },
      },
    ],
  }

  const queryOperations: QueryOperation[] = [{
    query: builtQueryForPart,
    operations: operationsForShowAndChangeColor,
  }]

  describe('createSceneAlteration', () => {
    it('sends a create alteration request with the given params', async () => {
      await createSceneAlteration(
        sceneViewId,
        queryOperations
      )({ stream, config });

      expect(stream.createSceneAlteration).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [expectedOperationResult],
          sceneViewId: { hex: sceneViewId.toString() },
        })
      );
    });

    it('sends a create alteration request for all with clear', async () => {
      const sceneViewId = UUID.create();
      const query: QueryExpression = {
        type: 'all',
      };
      const operations: ItemOperation[] = [
        {
          type: 'clear-override',
        },
      ];
      const queryOperations: QueryOperation[] = [{
        query,
        operations,
      }]

      await createSceneAlteration(
        sceneViewId,
        queryOperations
      )({ stream, config });

      expect(stream.createSceneAlteration).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            {
              all: {},
              operationTypes: [
                {
                  changeMaterial: {},
                },
              ],
            },
          ],
          sceneViewId: { hex: sceneViewId.toString() },
        })
      );
    });

    it('should support sending multiple operations in one request', async () => {
      const sceneViewId = UUID.create();
      const builtQueryA: QueryExpression = {
        type: 'all',
      };
      const operationsA: ItemOperation[] = [
        {
          type: 'clear-override',
        },
      ];

      const queryOperations: QueryOperation[] = [
        {
          query: builtQueryA,
          operations: operationsA,
        },
        {
          query: builtQueryForPart,
          operations: operationsForShowAndChangeColor
        }
      ]

      await createSceneAlteration(
        sceneViewId,
        queryOperations
      )({ stream, config });

      expect(stream.createSceneAlteration).toHaveBeenCalledWith(
        expect.objectContaining({
          operations: [
            {
              all: {},
              operationTypes: [
                {
                  changeMaterial: {},
                },
              ],
            },
            expectedOperationResult
          ],
          sceneViewId: { hex: sceneViewId.toString() },
        })
      );
    });
  });
});
