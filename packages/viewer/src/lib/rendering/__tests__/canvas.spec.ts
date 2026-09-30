import type { Mock } from '#test/mock-types';
vi.mock('../imageLoaders');

import { Dimensions } from '@vertexvis/geometry';
import { Async } from '@vertexvis/utils';

import * as Fixtures from '../../../testing/fixtures';
import { TimingMeter } from '../../meters';
import { Viewport } from '../../types';
import {
  CanvasRenderer,
  createCanvasRenderer,
  DrawFrame,
  measureCanvasRenderer,
} from '../canvas';
import { loadImageBytes } from '../imageLoaders';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const canvas = new HTMLCanvasElement().getContext('2d')!;
const image = {
  image: { width: 100, height: 50, close: vi.fn() },
  dispose: vi.fn(),
};
const image2 = {
  image: { width: 100, height: 50, close: vi.fn() },
  dispose: vi.fn(),
};

const drawFrame1: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame(),
  viewport: new Viewport(100, 50),
};

const drawFrame2: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame(),
  viewport: new Viewport(100, 50),
};

const drawFrame3: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame(),
  viewport: new Viewport(100, 50),
  beforeDraw: vi.fn(),
};

const drawFrame4: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame(),
  viewport: new Viewport(100, 50),
  beforeDraw: vi.fn(),
  predicate: vi.fn(() => false),
};

const drawFrame5: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame(),
  viewport: new Viewport(100, 50),
  beforeDraw: vi.fn(),
};

const drawFrame6: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame({
    ...Fixtures.drawFramePayloadPerspective,
    sequenceNumber: 2,
  }),
  viewport: new Viewport(100, 50),
  beforeDraw: vi.fn(),
};

const drawFrame7: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame({
    ...Fixtures.drawFramePayloadPerspective,
    frameCorrelationIds: ['corr-id-1'],
  }),
  viewport: new Viewport(100, 50),
  beforeDraw: vi.fn(),
};

const drawFrame8: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makePerspectiveFrame({
    ...Fixtures.drawFramePayloadPerspective,
    sequenceNumber: 2,
    frameCorrelationIds: ['corr-id-2'],
  }),
  viewport: new Viewport(100, 50),
  beforeDraw: vi.fn(),
};

describe(createCanvasRenderer, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (loadImageBytes as Mock).mockResolvedValue(image);
  });

  it('draws the next frame', async () => {
    const renderer = createCanvasRenderer();
    const drawImage = vi.spyOn(canvas, 'drawImage');
    const result = await renderer(drawFrame1);
    expect(result).toBeDefined();
    expect(drawImage).toHaveBeenCalled();
  });

  it('skips drawing previous frames', async () => {
    const renderer = createCanvasRenderer();
    const drawImage = vi.spyOn(canvas, 'drawImage');

    await renderer(drawFrame2);
    await renderer(drawFrame1);

    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  it('calls provided before draw callback', async () => {
    const renderer = createCanvasRenderer();
    const drawImage = vi.spyOn(canvas, 'drawImage');

    await renderer(drawFrame3);

    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawFrame3.beforeDraw).toHaveBeenCalledTimes(1);
  });

  it('skips loading and drawing if the predicate fails', async () => {
    const renderer = createCanvasRenderer();
    const drawImage = vi.spyOn(canvas, 'drawImage');

    await renderer(drawFrame4);

    expect(loadImageBytes).not.toHaveBeenCalled();
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('skips drawing if the frame to be drawn is older', async () => {
    const renderer = createCanvasRenderer();
    const drawImage = vi.spyOn(canvas, 'drawImage');

    (loadImageBytes as Mock)
      .mockImplementationOnce(async () => {
        await Async.delay(5);

        return image;
      })
      .mockResolvedValue(image2);

    const firstDraw = renderer(drawFrame5);
    const secondDraw = renderer(drawFrame6);
    await firstDraw;
    await secondDraw;

    expect(drawImage).toBeCalledTimes(1);
    expect(drawImage).toHaveBeenCalledWith(
      image2.image,
      0,
      0,
      image2.image.width,
      image2.image.height,
    );
  });

  it('tracks predicate skipped correlation ids and appends to following frames', async () => {
    const renderer = createCanvasRenderer();

    (loadImageBytes as Mock)
      .mockImplementationOnce(async () => {
        await Async.delay(5);

        return image;
      })
      .mockResolvedValue(image2);

    const firstResult = await renderer({
      ...drawFrame7,
      predicate: () => false,
    });
    const secondResult = await renderer(drawFrame8);

    expect(firstResult).toBeUndefined();
    expect(secondResult?.correlationIds).toMatchObject(
      expect.arrayContaining(['corr-id-2', 'corr-id-1']),
    );
  });

  it('tracks sequence number skipped correlation ids and appends to following frames', async () => {
    const renderer = createCanvasRenderer();

    (loadImageBytes as Mock)
      .mockImplementationOnce(async () => {
        await Async.delay(5);

        return image;
      })
      .mockResolvedValue(image2);

    const firstDraw = renderer(drawFrame7);
    const secondDraw = renderer(drawFrame8);
    const firstResult = await firstDraw;
    const secondResult = await secondDraw;

    expect(firstResult).toBeUndefined();
    expect(secondResult?.correlationIds).toMatchObject(
      expect.arrayContaining(['corr-id-2', 'corr-id-1']),
    );
  });

  it('disposes loaded image', async () => {
    const renderer = createCanvasRenderer();
    await renderer(drawFrame1);
    expect(image.dispose).toHaveBeenCalled();
  });
});

describe(measureCanvasRenderer, () => {
  const reportIntervalInMs = 10;

  const renderer: CanvasRenderer = () =>
    Promise.resolve(Fixtures.makePerspectiveFrame());
  const meter = new TimingMeter('timer');
  const measurement = { startTime: 0, duration: 1000 };

  vi.spyOn(meter, 'takeMeasurements').mockReturnValue([measurement]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports timings to api', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const render = measureCanvasRenderer(
      meter,
      renderer,
      false,
      callback,
      reportIntervalInMs,
    );

    render(drawFrame1);
    vi.advanceTimersByTime(reportIntervalInMs);

    expect(callback).toHaveBeenCalledWith(
      expect.arrayContaining([measurement]),
    );
  });

  it('stops reporting timer after last render', async () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const render = measureCanvasRenderer(
      meter,
      renderer,
      false,
      callback,
      reportIntervalInMs,
    );

    render(drawFrame1);
    await render(drawFrame2);
    vi.advanceTimersByTime(reportIntervalInMs);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
