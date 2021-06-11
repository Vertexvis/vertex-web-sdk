jest.mock('../imageLoaders');

import {
  createCanvasRenderer,
  DrawFrame,
  measureCanvasRenderer,
  CanvasRenderer,
  createCanvasDepthProvider,
  DrawPixel,
} from '../canvas';
import { Dimensions, Point } from '@vertexvis/geometry';
import * as Fixtures from '../../../testing/fixtures';
import { loadImageBytes } from '../imageLoaders';
import { Async } from '@vertexvis/utils';
import { TimingMeter } from '../../meters';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const canvas = new HTMLCanvasElement().getContext('2d')!;
const image = {
  image: { width: 100, height: 50, close: jest.fn() },
  dispose: jest.fn(),
};

const drawFrame1: DrawFrame = {
  canvas,
  dimensions: Dimensions.create(100, 50),
  frame: Fixtures.frame,
};

const drawFrame2: DrawFrame = {
  canvas,
  dimensions: Dimensions.create(100, 50),
  frame: Fixtures.frame,
};

const drawPixel: DrawPixel = {
  dimensions: Dimensions.create(100, 50),
  frame: Fixtures.frame,
  point: Point.create(0, 0),
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

describe(createCanvasDepthProvider, () => {
  (loadImageBytes as jest.Mock).mockResolvedValue(image);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns depth from the current frame', async () => {
    const renderer = createCanvasDepthProvider();
    const result = await renderer(drawPixel);
    expect(result).toBeCloseTo(1);
  });
});

describe(measureCanvasRenderer, () => {
  const renderDelayInMs = 5;
  const reportIntervalInMs = renderDelayInMs + 5;

  const frame = Fixtures.frame;
  const renderer: CanvasRenderer = () =>
    Async.delay(renderDelayInMs, Promise.resolve(frame));
  const meter = new TimingMeter('timer');
  const measurement = { startTime: 0, duration: 1000 };
  const callback = jest.fn();

  jest.spyOn(meter, 'takeMeasurements').mockReturnValue([measurement]);

  beforeEach(() => jest.clearAllMocks());

  it('reports timings to api', async () => {
    const render = measureCanvasRenderer(
      meter,
      renderer,
      false,
      callback,
      reportIntervalInMs
    );

    await render(drawFrame1);
    await Async.delay(reportIntervalInMs);

    expect(callback).toHaveBeenCalledWith(
      expect.arrayContaining([measurement])
    );
  });

  it('stops reporting timer after last render', async () => {
    const render = measureCanvasRenderer(
      meter,
      renderer,
      false,
      callback,
      reportIntervalInMs
    );

    render(drawFrame1);
    await render(drawFrame2);
    await Async.delay(reportIntervalInMs * 2);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
