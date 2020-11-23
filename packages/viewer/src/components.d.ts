/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { Config } from "./config/config";
import { Environment } from "./config/environment";
import { TapEventDetails } from "./interactions/tapEventDetails";
import { Frame } from "./types";
import { Disposable } from "@vertexvis/utils";
import { CommandFactory } from "./commands/command";
import { InteractionHandler } from "./interactions/interactionHandler";
import { Scene } from "./scenes/scene";
import { StreamAttributes } from "@vertexvis/stream-api";
export namespace Components {
    interface SvgIcon {
    }
    interface VertexViewer {
        /**
          * Enables or disables the default mouse and touch interactions provided by the viewer. Enabled by default.
         */
        "cameraControls": boolean;
        /**
          * An object or JSON encoded string that defines configuration settings for the viewer.
         */
        "config"?: Config | string;
        /**
          * Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.
          * @see Viewer.config
         */
        "configEnv": Environment;
        "getFrame": () => Promise<Frame.Frame | undefined>;
        "getInteractionHandlers": () => Promise<InteractionHandler[]>;
        /**
          * Loads the given scene into the viewer and return a `Promise` that resolves when the scene has been loaded. The specified scene is provided as a URN in the following format:    * `urn:vertexvis:scene:<sceneid>`
          * @param urn The URN of the resource to load.
         */
        "load": (urn: string) => Promise<void>;
        /**
          * Internal API.
          * @private
         */
        "registerCommand": <R, T>(id: string, factory: CommandFactory<R>, thisArg?: T | undefined) => Promise<Disposable>;
        /**
          * Registers and initializes an interaction handler with the viewer. Returns a `Disposable` that should be used to deregister the interaction handler.  `InteractionHandler`s are used to build custom mouse and touch interactions for the viewer. Use `<vertex-viewer camera-controls="false" />` to disable the default camera controls provided by the viewer.
          * @example class CustomInteractionHandler extends InteractionHandler {   private element: HTMLElement;   private api: InteractionApi;    public dispose(): void {     this.element.removeEventListener('click', this.handleElementClick);   }    public initialize(element: HTMLElement, api: InteractionApi): void {     this.api = api;     this.element = element;     this.element.addEventListener('click', this.handleElementClick);   }    private handleElementClick = (event: MouseEvent) => {     api.tap({ x: event.clientX, y: event.clientY });   } }  const viewer = document.querySelector("vertex-viewer"); viewer.registerInteractionHandler(new CustomInteractionHandler);
          * @param interactionHandler The interaction handler to register.
          * @returns - A promise containing the disposable to use to deregister the handler.
         */
        "registerInteractionHandler": (interactionHandler: InteractionHandler) => Promise<Disposable>;
        "scene": () => Promise<Scene>;
        /**
          * A URN of the scene resource to load when the component is mounted in the DOM tree. The specified resource is a URN in the following format:    * `urn:vertexvis:scene:<sceneid>`
         */
        "src"?: string;
        /**
          * Disconnects the websocket and removes any internal state associated with the scene.
         */
        "unload": () => Promise<void>;
        /**
          * Updates the viewer stream with a set of customizable `StreamAttributes`.
          * @param attributes The set of attributes to update the stream with.
         */
        "updateStream": (attributes: StreamAttributes) => Promise<void>;
    }
}
declare global {
    interface HTMLSvgIconElement extends Components.SvgIcon, HTMLStencilElement {
    }
    var HTMLSvgIconElement: {
        prototype: HTMLSvgIconElement;
        new (): HTMLSvgIconElement;
    };
    interface HTMLVertexViewerElement extends Components.VertexViewer, HTMLStencilElement {
    }
    var HTMLVertexViewerElement: {
        prototype: HTMLVertexViewerElement;
        new (): HTMLVertexViewerElement;
    };
    interface HTMLElementTagNameMap {
        "svg-icon": HTMLSvgIconElement;
        "vertex-viewer": HTMLVertexViewerElement;
    }
}
declare namespace LocalJSX {
    interface SvgIcon {
    }
    interface VertexViewer {
        /**
          * Enables or disables the default mouse and touch interactions provided by the viewer. Enabled by default.
         */
        "cameraControls"?: boolean;
        /**
          * An object or JSON encoded string that defines configuration settings for the viewer.
         */
        "config"?: Config | string;
        /**
          * Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.
          * @see Viewer.config
         */
        "configEnv"?: Environment;
        /**
          * Emits an event when a frame has been drawn to the viewer's canvas. The event will include details about the drawn frame, such as the `Scene` information related to the scene.
         */
        "onFrameDrawn"?: (event: CustomEvent<Frame.Frame>) => void;
        /**
          * Emits an event when a frame has been received by the viewer. The event will include details about the drawn frame, such as the `Scene` information related to the scene.
         */
        "onFrameReceived"?: (event: CustomEvent<Frame.Frame>) => void;
        /**
          * Emits an event whenever the user taps or clicks a location in the viewer. The event includes the location of the tap or click.
         */
        "onTap"?: (event: CustomEvent<TapEventDetails>) => void;
        /**
          * Emits an event when a provided oauth2 token is about to expire, or is about to expire, causing issues with establishing a websocket connection, or performing API calls.
         */
        "onTokenExpired"?: (event: CustomEvent<void>) => void;
        /**
          * A URN of the scene resource to load when the component is mounted in the DOM tree. The specified resource is a URN in the following format:    * `urn:vertexvis:scene:<sceneid>`
         */
        "src"?: string;
    }
    interface IntrinsicElements {
        "svg-icon": SvgIcon;
        "vertex-viewer": VertexViewer;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "svg-icon": LocalJSX.SvgIcon & JSXBase.HTMLAttributes<HTMLSvgIconElement>;
            "vertex-viewer": LocalJSX.VertexViewer & JSXBase.HTMLAttributes<HTMLVertexViewerElement>;
        }
    }
}
