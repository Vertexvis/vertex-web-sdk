import { applyPolyfills, defineCustomElements } from '@vertexvis/viewer/loader';
import { Plugin } from 'vue';

export const VertexViewerPlugin: Plugin = {
  async install() {
    applyPolyfills().then(() => {
      defineCustomElements();
    });
  },
};
