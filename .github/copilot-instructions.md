# Vertex Web SDK - AI Coding Assistant Instructions

## Project Architecture

This is a **Lerna-managed monorepo** providing TypeScript/JavaScript SDKs for 3D model visualization. The core viewer is built with **Stencil** web components and auto-generates React/Vue bindings.

### Key Packages

- `@vertexvis/viewer` - Main Stencil web components for 3D rendering (GPU-based streaming)
- `@vertexvis/geometry` - 2D/3D math utilities (Point, Vector3, Matrix4, BoundingBox, etc.)
- `@vertexvis/stream-api` - gRPC client for streaming 3D images
- `@vertexvis/utils` - Core utilities (Disposable, EventDispatcher, Color, UUID)
- `@vertexvis/viewer-react` - Auto-generated React bindings
- `@vertexvis/viewer-vue` - Auto-generated Vue bindings

## Development Workflow

**Setup**: `yarn install && yarn bootstrap` (runs Lerna bootstrap)

**Key Commands**:

- `yarn build` - Builds all packages via Lerna
- `yarn test` / `yarn test:coverage` - Runs Jest tests across packages
- `yarn examples:start` - Starts local dev server at http://localhost:8080
- `yarn examples:scaffold [name]` - Creates new example with boilerplate

**VS Code**: Auto-generates `.code-workspace` file for multi-root workspace support

## Critical Patterns

### Stencil Component Architecture

- Components use `@Component`, `@Prop`, `@State`, `@Method`, `@Event` decorators
- Main viewer: `packages/viewer/src/components/viewer/viewer.tsx`
- Event-driven architecture with `EventEmitter<T>` for component communication
- Auto-generates framework bindings via `stencil.config.ts` output targets

### Library Organization

- Namespace pattern: `import * as Point from './point'` (not default exports)
- Utility modules follow functional approach: `Point.create()`, `Matrix4.multiply()`
- Abstract base classes for extensibility: `BaseInteractionHandler`

### Interaction System

- Mouse/touch interactions via `BaseInteractionHandler` hierarchy
- Configurable interaction types: 'rotate', 'zoom', 'pan', 'twist', 'rotate-point', 'pivot'
- Event system: `InteractionApi` manages camera manipulation via streaming

### Resource Management

- Heavy use of `Disposable` pattern for cleanup (listeners, subscriptions, WebGL resources)
- `EventDispatcher` for type-safe pub/sub with automatic cleanup

### Testing Conventions

- Jest with `.spec.ts` files co-located with source
- Mock heavy dependencies (WebGL, gRPC streams)
- Focus on pure functions in geometry/utils packages

## Integration Points

**Authentication**: Stream keys for viewer access (`urn:vertex:stream-key:${streamKey}`)
**3D Streaming**: gRPC-web client connects to Vertex cloud for real-time frame streaming
**Framework Integration**: Stencil auto-generates React/Vue wrappers with proper TypeScript types

## Common Gotchas

- Viewer requires `defineCustomElements()` before use in vanilla JS
- Stream-based rendering means most 3D operations are asynchronous
- Geometry utilities use immutable patterns - functions return new instances
- Version bumping uses `nextVersionBump` in root `package.json` + `yarn version:bump`

## File Navigation

**Core viewer logic**: `packages/viewer/src/lib/`
**Component definitions**: `packages/viewer/src/components/`
**Examples for patterns**: `examples/*/main.js`
**Type definitions**: Look for `interfaces.d.ts` and individual package `src/` folders
