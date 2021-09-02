jest.mock('../viewer/utils');
jest.mock('../viewer-markup/dom');

import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Point } from '@vertexvis/geometry';
import { ViewerMarkupArrow } from './viewer-markup-arrow';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';

describe('vertex-viewer-markup-arrow', () => {
  const start = Point.create(0, -0.5);
  const end = Point.create(0, 0);
  (getMarkupBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    width: 100,
    height: 100,
  });

  it('positions the start and end anchors as Points', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupArrow],
      template: () => (
        <vertex-viewer-markup-arrow
          start={start}
          end={end}
          mode="edit"
        ></vertex-viewer-markup-arrow>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupArrowElement;
    const startEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-start-anchor'
    );
    const endEl = el?.shadowRoot?.getElementById('bounding-box-1d-end-anchor');
    const centerEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-center-anchor'
    );

    expect(startEl?.getAttribute('x')).toBe('46');
    expect(startEl?.getAttribute('y')).toBe('-4');
    expect(endEl?.getAttribute('x')).toBe('46');
    expect(endEl?.getAttribute('y')).toBe('46');
    expect(centerEl?.getAttribute('cx')).toBe('50');
    expect(centerEl?.getAttribute('cy')).toBe('25');
  });
});
