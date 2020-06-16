<!-- DO NOT EDIT THE README.md DIRECTLY. THIS FILE IS AUTO-GENERATED. -->
<!-- INSTEAD EDIT README.template.md -->

![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# Vertex Web Viewer SDK

This project contains Vertex's 3D Viewer SDK. Vertex is a cloud platform for
rendering large 3D models. See [Vertex's website][vertex] for more information.

Our 3D viewer is distributed as a set of standards-based [web components] that
can run in any browser supporting the Custom Elements v1 specification. For
browsers that do not support the Custom Elements v1 spec, a polyfill will
automatically be used.

## Getting Started

### Script Tag

To get started, add a `<script>` tag to your HTML file that references our
published JS bundle.

```html
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/@vertexvis/viewer@0.3.3/dist/viewer/viewer.css"
    />
    <script
      type="module"
      src="https://unpkg.com/@vertexvis/viewer@0.3.3/dist/viewer/viewer.esm.js"
    ></script>
    <script
      nomodule
      src="https://unpkg.com/@vertexvis/viewer@0.3.3/dist/viewer.js"
    ></script>
  </head>
</html>
```

### Node Modules

You can also install our components as an NPM dependency to your project.

- Run `npm install my-component --save`
- Put a script tag similar to this `<script src='node_modules/my-component/dist/mycomponent.js'></script>` in the head of your index.html
- Then you can use the element anywhere in your template, JSX, html etc

## Usage

```html
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/@vertexvis/viewer@0.3.3/dist/viewer/viewer.css"
    />
    <script
      type="module"
      src="https://unpkg.com/@vertexvis/viewer@0.3.3/dist/viewer/viewer.esm.js"
    ></script>
    <script
      nomodule
      src="https://unpkg.com/@vertexvis/viewer@0.3.3/dist/viewer.js"
    ></script>

    <script>
      window.addEventListener('DOMContentLoaded', () => {
        main();
      });

      function main() {
        const viewer = document.querySelector('#viewer');
        viewer.addEventListener('pick', event => {
          console.log('picked parts', event.details.hitResults);
        });
      }
    </script>
  </head>
  <body>
    <vertex-viewer
      id="viewer"
      credentials-client-id="client-id"
      credentials-token="token"
      scene="urn:vertexvis:scene:123"
    >
      <vertex-viewer-toolbar data-viewer="viewer"></vertex-viewer-toolbar>
    </vertex-viewer>
  </body>
</html>
```

[vertex]: https://www.vertexvis.com
[web components]: https://developer.mozilla.org/en-US/docs/Web/Web_Components
