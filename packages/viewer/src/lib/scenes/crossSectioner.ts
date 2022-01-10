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
   * @param crossSectioning The new cross sectioning.
   */
  public async update(
    crossSectioning: CrossSectioning.CrossSectioning
  ): Promise<
    vertexvis.protobuf.stream.IUpdateCrossSectioningResult | undefined
  > {
    const res = await this.stream.updateCrossSectioning(
      { crossSectioning },
      true
    );

    return res.updateCrossSectioning || undefined;
  }

  public current(): CrossSectioning.CrossSectioning {
    return this.data;
  }
}
