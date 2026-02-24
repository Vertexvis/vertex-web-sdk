jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';

import { mockGrpcUnaryResult, random } from '../../../testing';
import {
  makeCallout,
  makeCanvas,
  makeFreeform2d,
  makeGetCanvasResponse,
  makeLine2d,
  makeOval2d,
  makePin2d,
} from '../../../testing/canvases';
import { CanvasController } from '../controller';
import { mapCanvasItem, mapGetCanvasResponseOrThrow } from '../mapper';
import {
  CalloutItem,
  FreeformItem2d,
  LineItem2d,
  OvalItem2d,
  PinItem2d,
} from '../types';

describe(CanvasController, () => {
  const jwt = random.string();
  const deviceId = random.string();

  describe(CanvasController.prototype.getCanvas, () => {
    it('fetches a canvas', async () => {
      const { controller, client } = makeCanvasController(jwt, deviceId);
      const expected = makeGetCanvasResponse();

      (client.getCanvas as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(expected)
      );

      const res = await controller.getCanvas({ canvasId: UUID.create() });
      expect(res).toEqual(mapGetCanvasResponseOrThrow(expected.toObject()));
    });

    it('maps markup present within the canvas', async () => {
      const { controller, client } = makeCanvasController(jwt, deviceId);
      const primaryColor = '#00ff00';
      const accentColor = '#0000ff';
      const stroke = { thickness: 1, color: primaryColor };
      const fill = { color: accentColor };
      const line = makeLine2d({
        stroke,
        fill,
      });
      const oval = makeOval2d({
        stroke,
        fill,
      });
      const freeform = makeFreeform2d({
        stroke,
        fill,
      });
      const pin = makePin2d({
        primaryColor,
        accentColor,
      });
      const callout = makeCallout({
        primaryColor,
        accentColor,
      });
      const expected = makeGetCanvasResponse(
        makeCanvas(undefined, [line, oval, freeform, pin, callout])
      );

      (client.getCanvas as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(expected)
      );

      const res = await controller.getCanvas({ canvasId: UUID.create() });

      expect(res.items.find((i) => i.type === 'line-2d')).toMatchObject(
        mapCanvasItem(line.toObject()) as LineItem2d
      );
      expect(res.items.find((i) => i.type === 'oval-2d')).toMatchObject(
        mapCanvasItem(oval.toObject()) as OvalItem2d
      );
      expect(res.items.find((i) => i.type === 'freeform-2d')).toMatchObject(
        mapCanvasItem(freeform.toObject()) as FreeformItem2d
      );
      expect(res.items.find((i) => i.type === 'pin-2d')).toMatchObject(
        mapCanvasItem(pin.toObject()) as PinItem2d
      );
      expect(res.items.find((i) => i.type === 'callout')).toMatchObject(
        mapCanvasItem(callout.toObject()) as CalloutItem
      );
    });

    it('throws an error if both a canvas and scene-view-state ID are provided', async () => {
      const { controller } = makeCanvasController(jwt, deviceId);

      await expect(() =>
        controller.getCanvas({
          canvasId: UUID.create(),
          sceneViewStateId: UUID.create(),
        })
      ).rejects.toThrowError();
    });
  });

  function makeCanvasController(
    jwt: string,
    deviceId: string
  ): {
    controller: CanvasController;
    client: SceneViewAPIClient;
  } {
    const client = new SceneViewAPIClient('https://example.com');
    return {
      client,
      controller: new CanvasController(
        client,
        () => jwt,
        () => deviceId
      ),
    };
  }
});
