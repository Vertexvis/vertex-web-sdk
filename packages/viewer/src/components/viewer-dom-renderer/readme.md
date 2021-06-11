# vertex-viewer-dom-renderer

The `<vertex-viewer-dom-renderer>` is a component that is used to position and
transform DOM elements over a rendered scene. This element is useful for
creating interactive visual effects, like annotations, using HTML/CSS/JS.

Wrap elements in a `<vertex-viewer-dom-element>` to specify the 3D position,
rotation and scale of an element.

Renderer needs to be connected to a `<vertex-viewer>` in order to be notified
when the scene is rendered. If added as a child of a `<vertex-viewer>` element,
the renderer will be connected automatically.

**Example:** Creating a DOM renderer.

```html
<html>
  <head>
    <style>
      .pin {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
      <vertex-viewer-dom-renderer>
        <vertex-viewer-dom-element position="[0, 0, 0]">
          <div class="pin">1</div>
        </vertex-viewer-dom-element>
      </vertex-viewer-dom-renderer>
    </vertex-viewer>
  </body>
</html>
```

## 2D vs 3D Drawing Modes

The renderer supports either a 2D or a 3D drawing mode. In 3D mode, the renderer
will use CSS 3D transforms to position and transform an element, which allows
elements to be scaled and rotated with the model. In 2D mode, the renderer will
use a simpler CSS 2D transform that will position elements, but will not rotate
or scale them.

By default, the renderer will use 3D mode. Use the `draw-mode` attribute to
change the mode of the renderer.

## Positioning, Rotation, Scaling

The `<vertex-viewer-dom-element>` has attributes for setting the 3D position,
rotation and scale of a DOM element. Our
[@vertexvis/geometry](https://www.npmjs.com/package/@vertexvis/geometry) package
is a helper library for common 3D math operations.

**Example:** Positioning elements using HTML attributes.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
      <vertex-viewer-dom-renderer>
        <vertex-viewer-dom-element
          position="[0, 100, 0]"
          rotation="[90, 180, 0]"
          scale="[0.5, 0.5, 0.5]"
        >
          <div class="pin">1</div>
        </vertex-viewer-dom-element>
      </vertex-viewer-dom-renderer>
    </vertex-viewer>
  </body>
</html>
```

**Example:** Positioning elements using JS.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
      <vertex-viewer-dom-renderer>
        <vertex-viewer-dom-element id="my-pin">
          <div class="pin">1</div>
        </vertex-viewer-dom-element>
      </vertex-viewer-dom-renderer>
    </vertex-viewer>

    <script type="module">
      import { Vector3 } from 'https://unpkg.com/@vertexvis/geometry@latest/dist/cdn/bundle.esm.js';

      const pin = document.getElementById('my-pin');

      function animate() {
        requestAnimationFrame((time) => {
          const ms = 3000;
          const scale = 1 + (time % ms) / ms;
          pin.scale = Vector3.create(scale, scale, scale);

          animate();
        })
      }
      animate();
    </script>
  </body>
</html>
```

## Billboarding

When using a 3D draw mode, elements will always be reoriented towards the
screen. You can disable billboarding to orient elements based on their rotation
property.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
      <vertex-viewer-dom-renderer>
        <!-- Element with billboarding disabled -->
        <vertex-viewer-dom-element id="my-pin" billboard-off>
          <div class="pin">1</div>
        </vertex-viewer-dom-element>
      </vertex-viewer-dom-renderer>
    </vertex-viewer>
  </body>
</html>
```

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute   | Description                                                                                                                                                                                                                                                          | Type                                     | Default     |
| ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------- |
| `camera`      | --          | The current camera of the frame.  This property will automatically be set when supplying a viewer to the component, or when added as a child to `<vertex-viewer>`.                                                                                                   | `ReceivedPerspectiveCamera \| undefined` | `undefined` |
| `depthBuffer` | --          | The current depth buffer of the frame.  This property will automatically be set when supplying a viewer to the component, or when added as a child to `<vertex-viewer>`.                                                                                             | `DepthBuffer \| undefined`               | `undefined` |
| `drawMode`    | `draw-mode` | Specifies the drawing mode for the renderer.  When in `3d` mode, elements are positioned using CSS 3D transforms and will scale and rotate with the camera. In `2d` mode, a simpler 2D transform is used, and elements will not scale or rotate with camera changes. | `"2d" \| "3d"`                           | `'3d'`      |
| `viewer`      | --          | The viewer synced to this renderer. This property will automatically be assigned if the renderer is a child of `<vertex-viewer>`.                                                                                                                                    | `HTMLVertexViewerElement \| undefined`   | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
