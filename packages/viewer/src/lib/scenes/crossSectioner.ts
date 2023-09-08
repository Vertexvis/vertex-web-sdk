import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { StreamApi } from '@vertexvis/stream-api';

import { CrossSectioning } from '../types';

/**
 * The `CrossSectioner` class is here.
 */
export class CrossSectioner {
  public constructor(
    private stream: StreamApi,
    private data: CrossSectioning.CrossSectioning
  ) {}

  /**
   * Performs request on the stream to update the cross sectioning config.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector("vertex-viewer");
   * const scene = await viewer.scene();
   * const crossSectioner = scene.crossSectioning();
   *
   * await scene.crossSectioning().update({
   *   sectionPlanes: [
   *     {
   *       normal: {
   *         x: 1,
   *         y: 0,
   *         z: 0,
   *       },
   *       offset: 0,
   *     },
   *   ],
   *   highlightColor: Color.fromHexString("#ff0000"),
   *   lineWidth: 0.5,
   * });
   * ```
   *
   * @see {@link SectionPlane} for more information on the section planes.
   *
   * @see {@link CrossSectioning} for more information on the highlight color and
   * line width.
   *
   * @param crossSectioning The new cross sectioning.
   */
  public async update(
    crossSectioning: CrossSectioning.CrossSectioning
  ): Promise<
    vertexvis.protobuf.stream.IUpdateCrossSectioningResult | undefined
  > {
    const res = await this.stream.updateCrossSectioning(
      {
        crossSectioning: {
          sectionPlanes: crossSectioning.sectionPlanes,
          highlightColor: crossSectioning.highlightColor,
          lineWidth:
            crossSectioning?.lineWidth != null
              ? { value: crossSectioning.lineWidth }
              : null,
        },
      },
      true
    );

    return res.updateCrossSectioning || undefined;
  }

  public current(): CrossSectioning.CrossSectioning {
    return this.data;
  }
}
