/*!
 * Copyright (c) 2026 Vertex Software LLC. All rights reserved.
 */
import { render } from "@stencil/vitest";
import { vi } from "vitest";
export async function renderSpecPage(options) {
    var _a, _b;
    const template = (_b = (_a = options.template) === null || _a === void 0 ? void 0 : _a.call(options)) !== null && _b !== void 0 ? _b : options.html;
    if (template == null) {
        throw new Error('A template or html string is required to render a spec page');
    }
    // Source component imports register custom elements through stencilVitestPlugin.
    // The source transform does not resolve componentOnReady(), so wait for Stencil's
    // update cycle explicitly after rendering.
    const result = await render(template, { waitForReady: false });
    // render() reports the first top-level element. Legacy specs commonly place
    // one or more <template> fixtures before the component under test.
    let root = result.root;
    while (root.tagName === 'TEMPLATE' && root.nextElementSibling) {
        root = root.nextElementSibling;
    }
    const waitForChanges = async () => {
        const pending = result.waitForChanges(root);
        if (vi.isFakeTimers())
            await vi.advanceTimersByTimeAsync(32);
        await pending;
    };
    await waitForChanges();
    // The source transform adds a hydration marker that newSpecPage did not add.
    // Remove it from fixture DOM so existing class and HTML assertions keep their
    // meaning; this does not alter the compiled component output.
    const clearHydrationClasses = (node) => {
        for (const child of Array.from(node.children)) {
            if (child.tagName.includes('-')) {
                child.removeAttribute('hydrated');
                const names = (child.getAttribute('class') || '')
                    .split(/\s+/)
                    .filter((name) => name && name !== 'hydrated' && !name.startsWith('sc-'));
                if (names.length)
                    child.setAttribute('class', names.join(' '));
                else
                    child.removeAttribute('class');
            }
            if (child.shadowRoot)
                clearHydrationClasses(child.shadowRoot);
            clearHydrationClasses(child);
        }
    };
    if (root.tagName.includes('-')) {
        root.removeAttribute('hydrated');
        const names = (root.getAttribute('class') || '')
            .split(/\s+/)
            .filter((name) => name && name !== 'hydrated' && !name.startsWith('sc-'));
        if (names.length)
            root.setAttribute('class', names.join(' '));
        else
            root.removeAttribute('class');
    }
    if (root.shadowRoot)
        clearHydrationClasses(root.shadowRoot);
    clearHydrationClasses(root);
    return {
        ...result,
        root,
        waitForChanges: async () => {
            await waitForChanges();
            if (root.shadowRoot)
                clearHydrationClasses(root.shadowRoot);
            clearHydrationClasses(root);
        },
        rootInstance: root,
        body: document.body,
        doc: document,
    };
}
//# sourceMappingURL=vitest.render-spec-page.js.map
