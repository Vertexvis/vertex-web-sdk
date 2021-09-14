import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { ViewerMarkup } from './viewer-markup';
import { ViewerMarkupArrow } from '../viewer-markup-arrow/viewer-markup-arrow';
import {
  ArrowMarkup,
  CircleMarkup,
  FreeformMarkup,
} from '../../lib/types/markup';
import { Point, Rectangle } from '@vertexvis/geometry';
import { ViewerMarkupCircle } from '../viewer-markup-circle/viewer-markup-circle';
import { ViewerMarkupTool } from '../viewer-markup-tool/viewer-markup-tool';
import { ViewerMarkupFreeform } from '../viewer-markup-freeform.tsx/viewer-markup-freeform';

describe('vertex-viewer-markup', () => {
  const viewer = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const arrowMarkup = new ArrowMarkup({
    start: Point.create(0, 0),
    end: Point.create(0.5, 0.5),
  });
  const circleMarkup = new CircleMarkup({
    bounds: Rectangle.create(0, 0, 0.5, 0.5),
  });
  const freeformMarkup = new FreeformMarkup({
    points: [
      Point.create(0, 0),
      Point.create(0, -0.5),
      Point.create(0, 0),
      Point.create(0, 0),
      Point.create(-0.5, 0),
      Point.create(0, 0),
    ],
    bounds: Rectangle.create(0, 0, 0.5, 0.5),
  });

  describe('adding markup', () => {
    it('adds a markup element with default arrow markup', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `<vertex-viewer-markup></vertex-viewer-markup>`,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupElement = (await el.addMarkup(
        arrowMarkup
      )) as HTMLVertexViewerMarkupArrowElement;

      expect(el.children).toHaveLength(1);
      expect(markupElement.id).toBe(arrowMarkup.id);
      expect(markupElement.start).toBe(arrowMarkup.start);
      expect(markupElement.end).toBe(arrowMarkup.end);
    });

    it('adds an arrow markup element with arrow template', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `
          <template id="my-template">
            <vertex-viewer-markup-arrow class="my-class"></vertex-viewer-markup-arrow>
          </template>
          <vertex-viewer-markup arrow-template-id="my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(arrowMarkup);

      expect(markupEl).toHaveClass('my-class');
    });

    it('adds a default arrow markup element if arrow template not found', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `
          <template id="my-template">
            <vertex-viewer-markup-arrow class="my-class"></vertex-viewer-markup-arrow>
          </template>
          <vertex-viewer-markup arrow-template-id="not-my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(arrowMarkup);

      expect(markupEl).not.toHaveClass('my-class');
    });

    it('adds a default arrow markup element if arrow template does not contain an arrow markup', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `
          <template id="my-template">
            <div></div>
          </template>
          <vertex-viewer-markup arrow-template-id="my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(arrowMarkup);

      expect(markupEl).not.toHaveClass('my-class');
    });

    it('adds a circle markup element with circle template', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `
          <template id="my-template">
            <vertex-viewer-markup-circle class="my-class"></vertex-viewer-markup-circle>
          </template>
          <vertex-viewer-markup circle-template-id="my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(circleMarkup);

      expect(markupEl).toHaveClass('my-class');
    });

    it('adds a default circle markup element if circle template not found', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `
          <template id="my-template">
            <vertex-viewer-markup-circle class="my-class"></vertex-viewer-markup-circle>
          </template>
          <vertex-viewer-markup circle-template-id="not-my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(circleMarkup);

      expect(markupEl).not.toHaveClass('my-class');
    });

    it('adds a default circle markup element if circle template does not contain an circle markup', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `
          <template id="my-template">
            <div></div>
          </template>
          <vertex-viewer-markup circle-template-id="my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(circleMarkup);

      expect(markupEl).not.toHaveClass('my-class');
    });

    it('adds a freeform markup element with freeform template', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupFreeform],
        html: `
          <template id="my-template">
            <vertex-viewer-markup-freeform class="my-class"></vertex-viewer-markup-freeform>
          </template>
          <vertex-viewer-markup freeform-template-id="my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(freeformMarkup);

      expect(markupEl).toHaveClass('my-class');
    });

    it('adds a default freeform markup element if freeform template not found', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupFreeform],
        html: `
          <template id="my-template">
            <vertex-viewer-markup-freeform class="my-class"></vertex-viewer-markup-freeform>
          </template>
          <vertex-viewer-markup freeform-template-id="not-my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(freeformMarkup);

      expect(markupEl).not.toHaveClass('my-class');
    });

    it('adds a default freeform markup element if freeform template does not contain a freeform markup', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupFreeform],
        html: `
          <template id="my-template">
            <div></div>
          </template>
          <vertex-viewer-markup freeform-template-id="my-template"></vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(freeformMarkup);

      expect(markupEl).not.toHaveClass('my-class');
    });

    it('emits event when markup added programmatically', async () => {
      const onMarkupAdded = jest.fn();
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        template: () => <vertex-viewer-markup onMarkupAdded={onMarkupAdded} />,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(arrowMarkup);

      expect(onMarkupAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: markupEl,
        })
      );
    });

    it('emits event when markup added through user interaction', async () => {
      const onMarkupAdded = jest.fn();
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        template: () => <vertex-viewer-markup onMarkupAdded={onMarkupAdded} />,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      el.dispatchEvent(new CustomEvent('markupEnd', { detail: arrowMarkup }));

      expect(onMarkupAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: el.firstElementChild,
        })
      );
    });
  });

  describe('removing markup', () => {
    it('removes markup containing id', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `<vertex-viewer-markup></vertex-viewer-markup>`,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      await el.addMarkup(arrowMarkup);
      await el.removeMarkup(arrowMarkup.id);

      expect(el.children).toHaveLength(0);
    });

    it('emits event when markup removed programmatically', async () => {
      const onMarkupRemoved = jest.fn();
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        template: () => (
          <vertex-viewer-markup onMarkupRemoved={onMarkupRemoved} />
        ),
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(arrowMarkup);
      await el.removeMarkup(arrowMarkup.id);

      expect(onMarkupRemoved).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: markupEl,
        })
      );
    });
  });

  describe('query markup', () => {
    it('returns markup with id', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `<vertex-viewer-markup></vertex-viewer-markup>`,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      await el.addMarkup(arrowMarkup);
      await el.addMarkup(circleMarkup);

      const markupEl = await el.getMarkupElement(circleMarkup.id);
      expect(markupEl?.id).toEqual(circleMarkup.id);
    });

    it('returns all markups', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `<vertex-viewer-markup></vertex-viewer-markup>`,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      await el.addMarkup(arrowMarkup);
      await el.addMarkup(circleMarkup);

      const markups = await el.getMarkupElements();
      expect(markups).toHaveLength(2);
    });
  });

  describe('selecting markups', () => {
    it('sets editing mode on selected markup', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `<vertex-viewer-markup></vertex-viewer-markup>`,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      await el.addMarkup(arrowMarkup);
      await el.addMarkup(circleMarkup);

      el.selectedMarkupId = circleMarkup.id;
      await page.waitForChanges();

      const markupEl = await el.getMarkupElement(circleMarkup.id);
      expect(markupEl?.mode).toEqual('edit');
    });

    it('selects markup when pressed and not disabled', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `
          <vertex-viewer-markup>
            <vertex-viewer-markup-arrow id="m1" class="provided"></vertex-viewer-markup-arrow>
            <vertex-viewer-markup-arrow class="provided"></vertex-viewer-markup-arrow>
          </vertex-viewer-markup>
        `,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const provided = el.querySelectorAll('.provided');
      const markupEl1 = provided[0];
      const markupEl2 = provided[1];
      const markupEl3 = await el.addMarkup(arrowMarkup);

      // Should select, markup has ID
      markupEl1.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await page.waitForChanges();
      expect(el.selectedMarkupId).toEqual(markupEl1.id);

      // Should not select, markup does not have ID
      markupEl2.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await page.waitForChanges();
      expect(el.selectedMarkupId).toEqual(markupEl1.id);

      // Should select, markup has ID
      markupEl3.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await page.waitForChanges();
      expect(el.selectedMarkupId).toEqual(markupEl3.id);
    });

    it('does not select markup when pressed and disabled', async () => {
      const page = await newSpecPage({
        components: [ViewerMarkup, ViewerMarkupArrow, ViewerMarkupCircle],
        html: `<vertex-viewer-markup disabled></vertex-viewer-markup>`,
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(arrowMarkup);

      markupEl.dispatchEvent(new Event('pointerdown', { bubbles: true }));

      expect(el.selectedMarkupId).toBeUndefined();
    });
  });

  describe('markup tool', () => {
    it('sets markup tool with correct props', async () => {
      const page = await newSpecPage({
        components: [
          ViewerMarkup,
          ViewerMarkupTool,
          ViewerMarkupArrow,
          ViewerMarkupCircle,
        ],
        template: () => (
          <vertex-viewer-markup
            arrowTemplateId="my-arrow-template"
            circleTemplateId="my-circle-template"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            viewer={viewer as any}
          >
            <vertex-viewer-markup-tool />
          </vertex-viewer-markup>
        ),
      });

      const toolEl = page.root?.querySelector(
        'vertex-viewer-markup-tool'
      ) as HTMLVertexViewerMarkupToolElement;

      expect(toolEl.disabled).toBe(false);
      expect(toolEl.viewer).toBe(viewer);
      expect(toolEl.arrowTemplateId).toBe('my-arrow-template');
      expect(toolEl.circleTemplateId).toBe('my-circle-template');
      expect(toolEl.tool).toBe('arrow');
    });

    it('updates tool props when props change', async () => {
      const page = await newSpecPage({
        components: [
          ViewerMarkup,
          ViewerMarkupTool,
          ViewerMarkupArrow,
          ViewerMarkupCircle,
        ],
        template: () => (
          <vertex-viewer-markup>
            <vertex-viewer-markup-tool />
          </vertex-viewer-markup>
        ),
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const toolEl = el.querySelector(
        'vertex-viewer-markup-tool'
      ) as HTMLVertexViewerMarkupToolElement;

      el.arrowTemplateId = 'my-arrow-template';
      await page.waitForChanges();
      expect(toolEl.arrowTemplateId).toBe('my-arrow-template');

      el.circleTemplateId = 'my-circle-template';
      await page.waitForChanges();
      expect(toolEl.circleTemplateId).toBe('my-circle-template');

      el.disabled = true;
      await page.waitForChanges();
      expect(toolEl.disabled).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      el.viewer = viewer as any;
      await page.waitForChanges();
      expect(toolEl.viewer).toBe(viewer);
    });

    it('updates markup props when props change', async () => {
      const page = await newSpecPage({
        components: [
          ViewerMarkup,
          ViewerMarkupTool,
          ViewerMarkupArrow,
          ViewerMarkupCircle,
        ],
        template: () => (
          <vertex-viewer-markup>
            <vertex-viewer-markup-tool />
          </vertex-viewer-markup>
        ),
      });

      const el = page.root as HTMLVertexViewerMarkupElement;
      const markupEl = await el.addMarkup(arrowMarkup);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      el.viewer = viewer as any;
      await page.waitForChanges();
      expect(markupEl.viewer).toBe(viewer);
    });
  });
});
