import { defineCustomElements } from '@vertexvis/doc-viewer/loader';
import { Plugin } from 'vue';

export const VertexDocumentViewerPlugin: Plugin = {
  async install() {
    defineCustomElements();
  },
};
