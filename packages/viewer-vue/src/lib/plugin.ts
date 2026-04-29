import { defineCustomElements } from '@vertexvis/viewer/loader';
import { Plugin } from 'vue';

export const VertexViewerPlugin: Plugin = {
  async install() {
    defineCustomElements();
  },
};
