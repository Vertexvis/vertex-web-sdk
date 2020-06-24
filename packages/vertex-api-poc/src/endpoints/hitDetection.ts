import { HttpClient, HttpRequest } from '@vertexvis/network';
import { UUID, Uri } from '@vertexvis/utils';
import { Point, Dimensions } from '@vertexvis/geometry';
import { HitResult, CrossSection } from '../types';
import { parseJson, parseResponse } from '../parser';
import { Camera } from '@vertexvis/graphics3d';

export interface HitsByPixelBody {
  position: Point.Point;
  viewport: Dimensions.Dimensions;
  camera: Camera.Camera;
  crossSectioning?: CrossSection.CrossSection;
}

export async function getHitsByPixel(
  fetch: HttpClient.HttpClient,
  sceneStateId: UUID.UUID,
  body: HitsByPixelBody
): Promise<HitResult.HitResult[]> {
  const uri = Uri.parse(`/scene_states/${sceneStateId}/hits_by_pixel`);

  const response = await fetch(
    HttpRequest.post({
      url: Uri.toString(uri),
      body: {
        position: body.position,
        viewport: body.viewport,
        camera: body.camera,
        crossSectioning:
          body.crossSectioning != null
            ? body.crossSectioning
            : CrossSection.create([]),
      },
    })
  );

  return parseResponse(response, json =>
    (parseJson(json) as any[]).map(HitResult.fromJson)
  );
}
