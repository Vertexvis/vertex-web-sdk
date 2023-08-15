import { applyPolyfills, defineCustomElements } from '@vertexvis/viewer/loader';
import { Plugin } from 'vue';

export const ComponentLibrary: Plugin = {
  async install() {
    applyPolyfills().then(() => {
      defineCustomElements();
    });
  },
};
