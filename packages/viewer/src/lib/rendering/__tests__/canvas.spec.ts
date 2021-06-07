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
import * as Fixtures from '../../types/__fixtures__';
import { loadImageBytes } from '../imageLoaders';
import { Async } from '@vertexvis/utils';
import { TimingMeter } from '../../meters';

interface MockCanvasContext {
  clearRect: jest.Mock;
  drawImage: jest.Mock;
  getImageData: jest.Mock<{ data: Array<number | undefined> }>;
}

interface MockCanvas {
  getContext: jest.Mock<MockCanvasContext | undefined>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const canvas = new HTMLCanvasElement().getContext('2d')!;
const image = {
  image: { width: 100, height: 50, close: jest.fn() },
  dispose: jest.fn(),
};

const drawFrame1: DrawFrame = {
  canvas,
  dimensions: Dimensions.create(100, 50),
  frame: { ...Fixtures.frame, sequenceNumber: 1 },
};

const drawFrame2: DrawFrame = {
  canvas,
  dimensions: Dimensions.create(100, 50),
  frame: { ...Fixtures.frame },
};

const drawPixel: DrawPixel = {
  dimensions: Dimensions.create(100, 50),
  frame: { ...Fixtures.frame },
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
  const createMockContext = (value?: number): MockCanvasContext => ({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: [value, value, value, 255],
    })),
  });
  const createMockCanvas = (context?: MockCanvasContext): MockCanvas => ({
    getContext: jest.fn(() => context),
  });
  const mockCreateElement = (canvas: MockCanvas) => (name: string) => {
    if (name === 'canvas') {
      return canvas as any;
    }
    return window.document.createElement(name);
  };

  (loadImageBytes as jest.Mock).mockResolvedValue(image);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns depth from the current frame', async () => {
    const spy = jest.spyOn(window.document, 'createElement');
    spy.mockImplementation(
      mockCreateElement(createMockCanvas(createMockContext(50)))
    );

    const renderer = createCanvasDepthProvider();
    const result = await renderer(drawPixel);
    expect(result).toBeCloseTo(0.196);
  });

  it('returns zero if the image data is undefined', async () => {
    const spy = jest.spyOn(window.document, 'createElement');
    spy.mockImplementation(
      mockCreateElement(createMockCanvas(createMockContext()))
    );

    const renderer = createCanvasDepthProvider();
    const result = await renderer(drawPixel);
    expect(result).toBeCloseTo(0);
  });

  it('returns zero if the canvas context is undefined', async () => {
    const spy = jest.spyOn(window.document, 'createElement');
    spy.mockImplementation(mockCreateElement(createMockCanvas()));

    const renderer = createCanvasDepthProvider();
    const result = await renderer(drawPixel);
    expect(result).toBeCloseTo(0);
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
