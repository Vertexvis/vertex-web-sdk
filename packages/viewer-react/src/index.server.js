'use client';

// React server builds should resolve to the client boundary rather than
// importing the Stencil custom element modules on the server.
export * from '@vertexvis/viewer-react/client';
