jest.mock('../imageLoaders');

import { Dimensions } from '@vertexvis/geometry';

import * as Fixtures from '../../../testing/fixtures';
import { TimingMeter } from '../../meters';
import { Viewport } from '../../types';
import { createHiddenCanvasRenderer } from '..';
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
  image: { width: 100, height: 50, close: jest.fn() },
  dispose: jest.fn(),
};

const drawFrame1: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makeFrame(),
  viewport: new Viewport(100, 50),
};

const drawFrame2: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makeFrame(),
  viewport: new Viewport(100, 50),
};

const drawFrame3: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  frame: Fixtures.makeFrame(),
  viewport: new Viewport(100, 50),
  beforeDraw: jest.fn(),
};

const drawFrame4: DrawFrame = {
  canvas,
  canvasDimensions: Dimensions.create(100, 50),
  dimensions: Dimensions.create(500, 500),
  frame: Fixtures.makeFrame(),
  viewport: new Viewport(100, 50),
  beforeDraw: jest.fn(),
};

describe(createCanvasRenderer, () => {
  (loadImageBytes as jest.Mock).mockResolvedValue(image);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('draws the next frame', async () => {
    const renderer = createCanvasRenderer();
    const drawImage = jest.spyOn(canvas, 'drawImage');
    const result = await renderer(drawFrame1);
    expect(result).toBeDefined();
    expect(drawImage).toHaveBeenCalled();
  });

  it('skips drawing previous frames', async () => {
    const renderer = createCanvasRenderer();
    const drawImage = jest.spyOn(canvas, 'drawImage');

    await renderer(drawFrame2);
    await renderer(drawFrame1);

    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  it('disposes loaded image', async () => {
    const renderer = createCanvasRenderer();
    await renderer(drawFrame1);
    expect(image.dispose).toHaveBeenCalled();
  });
});

describe(createHiddenCanvasRenderer, () => {
  (loadImageBytes as jest.Mock).mockResolvedValue(image);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('draws the next frame', async () => {
    const renderer = createHiddenCanvasRenderer();
    const drawImage = jest.spyOn(canvas, 'drawImage');
    const result = await renderer(drawFrame1);
    expect(result).toBeDefined();
    expect(drawImage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 0, 0);
  });

  it('skips drawing previous frames', async () => {
    const renderer = createHiddenCanvasRenderer();
    const drawImage = jest.spyOn(canvas, 'drawImage');

    await renderer(drawFrame2);
    await renderer(drawFrame1);

    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  it('calls the before draw callback if provided', async () => {
    const renderer = createHiddenCanvasRenderer();

    await renderer(drawFrame3);

    expect(drawFrame3.beforeDraw).toHaveBeenCalled();
  });

  it('does not draw if the frame does not match dimensions', async () => {
    const renderer = createHiddenCanvasRenderer();
    const drawImage = jest.spyOn(canvas, 'drawImage');

    await renderer(drawFrame4);

    expect(drawImage).not.toHaveBeenCalledTimes(1);
  });

  it('disposes loaded image', async () => {
    const renderer = createHiddenCanvasRenderer();
    await renderer(drawFrame1);
    expect(image.dispose).toHaveBeenCalled();
  });
});

describe(measureCanvasRenderer, () => {
  const reportIntervalInMs = 10;

  const renderer: CanvasRenderer = () => Promise.resolve(Fixtures.makeFrame());
  const meter = new TimingMeter('timer');
  const measurement = { startTime: 0, duration: 1000 };

  jest.spyOn(meter, 'takeMeasurements').mockReturnValue([measurement]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reports timings to api', () => {
    jest.useFakeTimers();

    const callback = jest.fn();
    const render = measureCanvasRenderer(
      meter,
      renderer,
      false,
      callback,
      reportIntervalInMs
    );

    render(drawFrame1);
    jest.advanceTimersByTime(reportIntervalInMs);

    expect(callback).toHaveBeenCalledWith(
      expect.arrayContaining([measurement])
    );
  });

  it('stops reporting timer after last render', async () => {
    jest.useFakeTimers();

    const callback = jest.fn();
    const render = measureCanvasRenderer(
      meter,
      renderer,
      false,
      callback,
      reportIntervalInMs
    );

    render(drawFrame1);
    await render(drawFrame2);
    jest.advanceTimersByTime(reportIntervalInMs);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
