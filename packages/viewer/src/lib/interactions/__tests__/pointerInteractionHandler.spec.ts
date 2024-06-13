jest.mock('../interactionApi');
jest.mock('../mouseInteractions');

import { parseConfig } from '../../config';
import { InteractionApi } from '../interactionApi';
import {
  PanInteraction,
  RotateInteraction,
  RotatePointInteraction,
  TwistInteraction,
  ZoomInteraction,
} from '../mouseInteractions';
import { PointerInteractionHandler } from '../pointerInteractionHandler';

const InteractionApiMock = InteractionApi as jest.Mock<InteractionApi>;
const PanInteractionMock = PanInteraction as jest.Mock<PanInteraction>;
const ZoomInteractionMock = ZoomInteraction as jest.Mock<ZoomInteraction>;
const RotateInteractionMock = RotateInteraction as jest.Mock<RotateInteraction>;
const RotatePointInteractionMock =
  RotateInteraction as jest.Mock<RotatePointInteraction>;
const TwistInteractionMock = TwistInteraction as jest.Mock<TwistInteraction>;

describe(PointerInteractionHandler, () => {
  const rotateInteraction = new RotateInteractionMock();
  const rotatePointInteraction = new RotatePointInteractionMock();
  const zoomInteraction = new ZoomInteractionMock();
  const panInteraction = new PanInteractionMock();
  const twistInteraction = new TwistInteractionMock();
  const api = new InteractionApiMock();

  const div = document.createElement('div');
  const pointerDown = new MouseEvent('pointerdown', {
    screenX: 100,
    screenY: 50,
    buttons: 1,
    bubbles: true,
  });

  const pointerMove = new MouseEvent('pointermove', {
    screenX: 110,
    screenY: 60,
    buttons: 1,
    bubbles: true,
  });

  const pointerUp = new MouseEvent('pointerup', {
    screenX: 100,
    screenY: 50,
    buttons: 1,
    bubbles: true,
  });

  const wheelEvent = new Event('wheel', {
    deltaY: 100,
    deltaMode: 0,
  } as unknown as EventInit);

  const config = parseConfig('platdev');
  const handler = new PointerInteractionHandler(
    () => ({
      ...config,
      interactions: {
        ...config.interactions,
        interactionDelay: 10,
      },
    }),
    rotateInteraction,
    rotatePointInteraction,
    zoomInteraction,
    panInteraction,
    twistInteraction
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    api.pixelThreshold = jest.fn(() => 2);
    handler.setPrimaryInteractionType('rotate');
    handler.initialize(div, api);
  });

  afterEach(() => {
    handler.dispose();
  });

  it('begins a drag of primary interaction if the primary mouse has moved more than 2 pixels', async () => {
    await simulatePrimaryInteractions(50);

    expect(rotateInteraction.beginDrag).toHaveBeenCalledTimes(1);
    expect(rotateInteraction.drag).toHaveBeenCalledTimes(1);
    expect(rotateInteraction.endDrag).toHaveBeenCalledTimes(1);
  });

  it('zooms on wheel events', async () => {
    div.dispatchEvent(wheelEvent);

    await delay(50);

    expect(zoomInteraction.zoomToPoint).toHaveBeenCalled();
  });

  it('supports interactions on additionally registered elements', async () => {
    const additionalDiv = document.createElement('div');

    const disposable = handler.registerAdditionalElement(additionalDiv);

    additionalDiv.dispatchEvent(wheelEvent);

    await delay(50);

    disposable.dispose();

    expect(zoomInteraction.zoomToPoint).toHaveBeenCalled();

    (zoomInteraction.zoomToPoint as jest.Mock).mockReset();
    additionalDiv.dispatchEvent(wheelEvent);

    await delay(50);

    // when disposing the listener, only the initial zoom to point should be called
    expect(zoomInteraction.zoomToPoint).not.toHaveBeenCalled();
  });

  async function simulatePrimaryInteractions(
    interactionDelay?: number
  ): Promise<void> {
    div.dispatchEvent(pointerDown);
    window.dispatchEvent(pointerMove);
    await delay(interactionDelay || 0);
    window.dispatchEvent(pointerUp);
  }

  function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
});
