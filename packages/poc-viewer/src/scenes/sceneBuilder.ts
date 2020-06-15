import { SceneStates } from '@vertexvis/vertex-api';
import {
  createBulkBomOperationFromDefinition,
  dedupBulkBomOperations,
} from './bulkBomOperations';
import {
  OperationDefinition,
  SceneItemOperations,
  SceneOperationBuilder,
  SelectorFactory,
} from './operations';
import { HttpClientProvider } from '../api-client/httpClient';

interface NewSceneDefinition {
  resource: string;
  operations: OperationDefinition[];
}

type Executor = (sceneDefinition: NewSceneDefinition) => Promise<string>;

/**
 * An executor that can be passed to a `SceneBuilder` to perform the building
 * of a scene. This executor is considered temporary for the JD PoC as it uses
 * our EEDC APIs to construct a scene.
 */
export function httpSceneBuilderExecutor(
  httpClientProvider: HttpClientProvider
): Executor {
  return async (sceneDefinition: NewSceneDefinition) => {
    const operations = dedupBulkBomOperations(
      sceneDefinition.operations.reduce(
        (result, definition) => [
          ...result,
          ...createBulkBomOperationFromDefinition(definition),
        ],
        []
      )
    );
    const request = { urn: sceneDefinition.resource, operations };
    const response = await SceneStates.create(httpClientProvider(), request);
    return `urn:vertexvis:eedc:scenestate:${response.sceneStateId}`;
  };
}

/**
 * A `SceneBuilder` provides a fluent interface for constructing a Scene. The
 * builder contains methods that can be used to construct a scene from a file,
 * and operations that are used to setup the scene before viewing.
 */
export class SceneBuilder implements SceneItemOperations<SceneBuilder> {
  private resource?: string;
  private sceneOperationsBuilder = new SceneOperationBuilder();

  public constructor(private executor: Executor) {}

  /**
   * The file or scene state to build the scene from. The specified resource is
   * a URN in one of the following formats:
   *
   *  * `urn:vertexvis:eedc:file:<fileid>`
   *  * `urn:vertexvis:eedc:scenestate:<scenestateid>`
   *  * `urn:vertexvis:eedc:file?externalId=<externalId>`
   *
   * @param resource A URN of the file or scene state to build the scene from.
   */
  public from(resource: string): SceneBuilder {
    this.resource = resource;
    return this;
  }

  public clearAllHighlights(): SceneBuilder {
    this.sceneOperationsBuilder.clearAllHighlights();
    return this;
  }

  public hide(selector: SelectorFactory): SceneBuilder {
    this.sceneOperationsBuilder.hide(selector);
    return this;
  }

  public showAll(): this {
    this.sceneOperationsBuilder.showAll();
    return this;
  }

  public hideAll(): this {
    this.sceneOperationsBuilder.hideAll();
    return this;
  }

  public highlight(color: string, selector: SelectorFactory): SceneBuilder {
    this.sceneOperationsBuilder.highlight(color, selector);
    return this;
  }

  public show(selector: SelectorFactory): SceneBuilder {
    this.sceneOperationsBuilder.show(selector);
    return this;
  }

  public showOnly(selector: SelectorFactory): SceneBuilder {
    this.sceneOperationsBuilder.showOnly(selector);
    return this;
  }

  /**
   * Executes the creation of the scene and returns a URN for the created
   * scene.
   */
  public execute(): Promise<string> {
    if (this.resource == null) {
      throw new Error('Cannot build scene. Resource is undefined.');
    }
    const operations = this.sceneOperationsBuilder.build();
    return this.executor({ resource: this.resource, operations });
  }
}
