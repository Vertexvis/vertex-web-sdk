import {
  CalloutItem as PBCalloutItem,
  CanvasDocumentV1 as PBCanvasDocumentV1,
  CanvasItem as PBCanvasItem,
  EndShape as PBEndShape,
  FillStyle as PBFillStyle,
  FreeformItem2d as PBFreeformItem2d,
  LineItem2d as PBLineItem2d,
  OvalItem2d as PBOvalItem2d,
  Pin2d as PBPin2d,
  StrokeStyle as PBStrokeStyle,
} from '@vertexvis/scene-view-protos/core/protos/scene_canvas_pb';
import { GetCanvasResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Mapper as M } from '@vertexvis/utils';

import {
  fromPbRGBAi,
  fromPbUuid2l,
  fromPbVector2d,
  fromPbVector3f,
} from '../mappers';
import {
  ArrowEndShape,
  CalloutItem,
  CanvasDocument,
  CircleEndShape,
  DashEndShape,
  FillStyle,
  FreeformItem2d,
  LineItem2d,
  OvalItem2d,
  PinItem2d,
  StrokeStyle,
} from './types';

const mapStrokeStyle: M.Func<PBStrokeStyle.AsObject, StrokeStyle> =
  M.defineMapper(
    M.read(M.mapRequiredProp('color', fromPbRGBAi), M.getProp('thickness')),
    ([color, thickness]) => ({ color, thickness })
  );

const mapFillStyle: M.Func<PBFillStyle.AsObject, FillStyle> = M.defineMapper(
  M.read(M.mapRequiredProp('color', fromPbRGBAi)),
  ([color]) => ({ color })
);

const mapEndShape: M.Func<
  PBEndShape.AsObject,
  ArrowEndShape | CircleEndShape | DashEndShape | undefined
> = M.defineMapper(
  M.read(
    M.pickFirst(
      M.mapProp(
        'arrow',
        M.ifDefined((a): ArrowEndShape => ({ ...a, type: 'arrow-end' }))
      ),
      M.mapProp(
        'circle',
        M.ifDefined((a): CircleEndShape => ({ ...a, type: 'circle-end' }))
      ),
      M.mapProp(
        'dash',
        M.ifDefined((a): DashEndShape => ({ ...a, type: 'dash-end' }))
      )
    )
  ),
  ([shape]) => shape ?? undefined
);

const mapLineItem2d: M.Func<PBLineItem2d.AsObject, LineItem2d> = M.defineMapper(
  M.read(
    M.mapRequiredProp('startPosition', fromPbVector2d),
    M.mapRequiredProp('endPosition', fromPbVector2d),
    M.mapProp('strokeStyle', M.ifDefined(mapStrokeStyle)),
    M.mapProp('fillStyle', M.ifDefined(mapFillStyle)),
    M.mapProp('startShape', M.ifDefined(mapEndShape)),
    M.mapProp('endShape', M.ifDefined(mapEndShape))
  ),
  ([
    startPosition,
    endPosition,
    strokeStyle,
    fillStyle,
    startShape,
    endShape,
  ]) => ({
    type: 'line-2d',
    startPosition,
    endPosition,
    strokeStyle,
    fillStyle,
    startShape: startShape ?? undefined,
    endShape: endShape ?? undefined,
  })
);

const mapOvalItem2d: M.Func<PBOvalItem2d.AsObject, OvalItem2d> = M.defineMapper(
  M.read(
    M.mapRequiredProp('topLeft', fromPbVector2d),
    M.mapRequiredProp('bottomRight', fromPbVector2d),
    M.mapProp('strokeStyle', M.ifDefined(mapStrokeStyle)),
    M.mapProp('fillStyle', M.ifDefined(mapFillStyle))
  ),
  ([topLeftPosition, bottomRightPosition, strokeStyle, fillStyle]) => ({
    type: 'oval-2d',
    topLeftPosition,
    bottomRightPosition,
    strokeStyle,
    fillStyle,
  })
);

const mapFreeformItem2d: M.Func<PBFreeformItem2d.AsObject, FreeformItem2d> =
  M.defineMapper(
    M.read(
      M.mapRequiredProp('positionsList', M.mapArray(fromPbVector2d)),
      M.mapProp('strokeStyle', M.ifDefined(mapStrokeStyle)),
      M.mapProp('fillStyle', M.ifDefined(mapFillStyle))
    ),
    ([positions, strokeStyle, fillStyle]) => ({
      type: 'freeform-2d',
      positions,
      strokeStyle,
      fillStyle,
    })
  );

const mapPinItem2d: M.Func<PBPin2d.AsObject, PinItem2d> = M.defineMapper(
  M.read(
    M.mapRequiredProp('primaryColor', fromPbRGBAi),
    M.mapRequiredProp('accentColor', fromPbRGBAi),
    M.mapRequiredProp('position', fromPbVector3f),
    M.mapProp('sceneItemId', M.ifDefined(fromPbUuid2l))
  ),
  ([primaryColor, accentColor, position, sceneItemId]) => ({
    type: 'pin-2d',
    primaryColor,
    accentColor,
    position,
    sceneItemId: sceneItemId ?? undefined,
  })
);

const mapCalloutItem: M.Func<PBCalloutItem.AsObject, CalloutItem> =
  M.defineMapper(
    M.read(
      M.mapRequiredProp('primaryColor', fromPbRGBAi),
      M.mapRequiredProp('accentColor', fromPbRGBAi),
      M.mapRequiredProp('anchorPosition', fromPbVector3f),
      M.mapRequiredProp('textPosition', fromPbVector2d),
      M.getProp('text'),
      M.mapProp('sceneItemId', M.ifDefined(fromPbUuid2l))
    ),
    ([
      primaryColor,
      accentColor,
      anchorPosition,
      textPosition,
      text,
      sceneItemId,
    ]) => ({
      type: 'callout',
      primaryColor,
      accentColor,
      anchorPosition,
      textPosition,
      text,
      sceneItemId: sceneItemId ?? undefined,
    })
  );

/**
 * @internal
 * @ignore
 *
 * Visible for testing.
 */
export const mapCanvasItem: M.Func<
  PBCanvasItem.AsObject,
  LineItem2d | OvalItem2d | FreeformItem2d | PinItem2d | CalloutItem | undefined
> = M.defineMapper(
  M.read(
    M.pickFirst(
      M.mapProp('line2d', M.ifDefined(mapLineItem2d)),
      M.mapProp('oval', M.ifDefined(mapOvalItem2d)),
      M.mapProp('freeform', M.ifDefined(mapFreeformItem2d)),
      M.mapProp('pin', M.ifDefined(mapPinItem2d)),
      M.mapProp('callout', M.ifDefined(mapCalloutItem))
    )
  ),
  ([canvasItem]) => canvasItem ?? undefined
);

const mapCanvasDocument: M.Func<PBCanvasDocumentV1.AsObject, CanvasDocument> =
  M.defineMapper(
    M.read(M.mapRequiredProp('itemsList', M.mapArray(mapCanvasItem))),
    ([items]) => ({ items: items.filter(<T>(i?: T): i is T => i != null) })
  );

const mapGetCanvasResponse: M.Func<GetCanvasResponse.AsObject, CanvasDocument> =
  M.defineMapper(
    M.read(
      M.mapRequiredProp(
        'canvas',
        M.mapRequiredProp(
          'document',
          M.mapRequiredProp('v1', mapCanvasDocument)
        )
      )
    ),
    ([doc]) => doc
  );

export const mapGetCanvasResponseOrThrow =
  M.ifInvalidThrow(mapGetCanvasResponse);
