jest.mock('../viewer/utils');
jest.mock('../viewer-markup/dom');

import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Point } from '@vertexvis/geometry';
import { ViewerMarkupArrow } from './viewer-markup-arrow';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  BoundingBox1d,
  BoundingBoxAnchor,
} from '../viewer-markup/viewer-markup-components';

describe('vertex-viewer-markup-arrow', () => {
  const start = Point.create(0.5, 0);
  const end = Point.create(0.5, 0.5);
  (getMarkupBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 150,
    right: 200,
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
        ></vertex-viewer-markup-arrow>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupArrowElement;
    await page.waitForChanges();

    console.log(el.firstChild);
    console.log(el.firstElementChild);
    console.log(el.shadowRoot?.firstChild?.lastChild);
    console.log(el?.shadowRoot?.querySelector('rect'));
    console.log(el?.firstChild);

    expect(
      (el.shadowRoot?.querySelector(
        '#bounding-box-1d-start-anchor'
      ) as SVGRectElement).x
    ).toBe(4);
  });
});
