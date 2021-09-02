import * as THREE from 'https://cdn.skypack.dev/three';
import { loadImageBytes } from '/dist/viewer/index.esm.js';

export class FeatureRolloverInteractionHandler {
  constructor(
    renderer,
    flexClient,
    featureMapContext,
    uniforms,
    sceneId = '8b1be7e9-7324-4d66-a40f-ac813bcee884'
  ) {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.blendedRenderer = renderer;
    this.quadUniforms = uniforms;
    this.flexClient = flexClient;
    this.featureMapContext = featureMapContext;
    this.degrees_to_radians = (deg) => (deg * Math.PI) / 180.0;
    this.showFeatureMap = false;
    this.sceneId = sceneId;
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.handleMouseDown);
    window.removeEventListener('pointermove', this.handleMouseMove);
    this.postMaterial.dispose();
  }

  /**
   * The initialize method of your custom interaction handler will be called
   * whenever it is registered with the viewer through viewer.registerInteractionHandler().
   * The element provided is a reference to the canvas where the vertex-viewer component
   * will draw images that it receives. Event listeners can be added to this element to
   * drive custom interactions.
   *
   * The api provided is an instance of the InteractionApi of the vertex-viewer,
   * which exposes methods that can be used to modify the internal state of an interaction.
   * This allows for control over things like the beginning and ending of interactions, or
   * transformation of the camera through pan, zoom, and rotate helpers.
   *
   * @param {*} element the reference to the canvas element.
   * @param {*} api the instance of the InteractionApi.
   */
  initialize(element, api) {
    this.api = api;
    this.viewport = this.api.getViewport();
    this.element = element;
    this.scene = this.api.getScene();
    this.element.addEventListener('pointerdown', this.handleMouseDown);
    this.element.addEventListener('pointermove', this.handleMouseMove);
  }

  enableShowFeatureMap(show) {
    this.showFeatureMap = show;
  }

  async handleMouseDown(event) {
    // add the listener that will enable rollover
    window.addEventListener('pointerup', this.handleMouseUp);
    // remove the rollover listener
    window.removeEventListener('pointermove', this.handleMouseMove);
    this.tryBeginInteraction();
    // update the shader
    this.quadUniforms.u_highlightFeature.value = false;
  }

  async handleMouseMove(event) {
    if (!this.isInteracting) {
      // translate mouse position to texture coordinates relative to the canvas
      var rect = event.target.getBoundingClientRect();
      var mouse_x = event.clientX - rect.left;
      var mouse_y = event.clientY - rect.top;
      const x = mouse_x / this.api.getViewport().width;
      const y = 1 - mouse_y / this.api.getViewport().height;
      this.quadUniforms.featureMap.needsUpdate = true;
      this.quadUniforms.u_mouse = {
        value: [x, y],
      };
      // update!!
      this.blendedRenderer.draw();
    }
  }

  async handleMouseUp() {
    // enable feature hightligting when not moving
    let camera = this.api.getScene().frame.scene.camera;
    const width = this.api.getViewport().width;
    const height = this.api.getViewport().height;
    let request = {
      sceneId: this.sceneId, //'8b1be7e9-7324-4d66-a40f-ac813bcee884', //TODO why isn't this on the scene?
      sceneViewId: this.scene.sceneViewId,
      dimensions: {
        width: width,
        height: height,
      },
      camera: {
        value: {
          oneofKind: 'monocularCamera',
          monocularCamera: this.makeMonocularCamera(camera),
        },
      },
      entities: [{ entityType: 0 }], // Faces
      imageType: 2, //PNG
    };
    for await (let message of this.flexClient.getFeatureMap(request)
      .responses) {
      console.log(message);
      if (this.showFeatureMap) {
        this.showFeatureMapFromReponse(message).then(() => {
          console.log('Image displayed for ' + message);
        });
      }

      loadImageBytes(message.featureEntityMap)
        .then((image) => {
          return this.updateFeatureMapTexture(image.image, width, height);
        })
        .then(() => {
          this.quadUniforms.featureMap.value.needsUpdate = true;
          this.quadUniforms.u_highlightFeature.value = true;
          this.quadUniforms.diffuseMap.value.needsUpdate = true;
        });
    }
    this.api.endInteraction();
    this.isInteracting = false;
  }

  async showFeatureMapFromReponse(response) {
    const encoding = response.imageType === 2 ? 'image/png' : 'image/jpeg';
    const imageData = response.featureEntityMap;
    // debug display the feature map
    const blick = new Blob([imageData], { type: encoding });
    window.open(URL.createObjectURL(blick), 'Name', 'resizable=1');
  }

  /**
   * Marks the beginning of an interaction if it has not already been marked.
   * This call to `beginInteraction` is required prior to any transformation of
   * the camera.
   */
  tryBeginInteraction() {
    if (!this.isInteracting) {
      this.api.beginInteraction();
      this.isInteracting = true;
    }
  }

  makeMonocularCamera(sceneCamera) {
    const ymax =
      sceneCamera.near *
      Math.tan(this.degrees_to_radians(sceneCamera.fovY / 2.0));
    const xmax = ymax * sceneCamera.aspectRatio;

    const left = -xmax;
    const right = xmax;
    const top = ymax;
    const bottom = -ymax;
    return {
      // these are not specified as used ...this gets
      // converted in flexy-time to a graphics.Camera so that
      // it can create a renderframeevent...internally it then
      // creates a monocular camera....¯\_(ツ)_/¯
      from: sceneCamera.position,
      up: sceneCamera.up,
      at: sceneCamera.lookAt,
      direction: {
        x: sceneCamera.direction.x,
        y: sceneCamera.direction.y,
        z: sceneCamera.direction.z,
      },
      // aspect: sceneCamera.aspectRatio,
      fov: sceneCamera.fovY,
      frustum: {
        near: sceneCamera.near,
        far: sceneCamera.far,
        left: left,
        right: right,
        top: top,
        bottom: bottom,
      },
    };
  }

  async updateFeatureMapTexture(data, width, height) {
    this.featureMapContext.canvas.width = width;
    this.featureMapContext.canvas.height = height;
    this.featureMapContext.clearRect(0, 0, width, height);
    this.featureMapContext.drawImage(data, 0, 0, width, height);
  }
}
