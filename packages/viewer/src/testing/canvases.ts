import { RGBAi } from '@vertexvis/scene-view-protos/core/protos/material_pb';
import {
  ArrowEndShape as ApiArrowEndShape,
  CalloutItem as ApiCalloutItem,
  Canvas,
  CanvasDocument,
  CanvasDocumentV1,
  CanvasItem,
  CircleEndShape as ApiCircleEndShape,
  DashEndShape as ApiDashEndShape,
  EndShape as ApiEndShape,
  FillStyle as ApiFillStyle,
  FreeformItem2d as ApiFreeformItem2d,
  LineItem2d as ApiLineItem2d,
  OvalItem2d as ApiOvalItem2d,
  Pin2d as ApiPinItem2d,
  StrokeStyle as ApiStrokeStyle,
} from '@vertexvis/scene-view-protos/core/protos/scene_canvas_pb';
import { GetCanvasResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Color, UUID } from '@vertexvis/utils';

import {
  ArrowEndShape,
  CalloutItem,
  CircleEndShape,
  DashEndShape,
  FreeformItem2d,
  LineItem2d,
  OvalItem2d,
  PinItem2d,
} from '../lib/canvases/types';
import { random } from '.';
import { makeVector2d, makeVector3f } from './geometry';
import { makeUuid2l } from './uuid';

export function makeGetCanvasResponse(
  canvas: Canvas = makeCanvas()
): GetCanvasResponse {
  const res = new GetCanvasResponse();
  res.setCanvas(canvas);
  return res;
}

export function makeCanvas(
  id: UUID.UUID = UUID.create(),
  itemsList: CanvasItem[] = [
    makeLine2d(),
    makeOval2d(),
    makeFreeform2d(),
    makePin2d(),
    makeCallout(),
  ]
): Canvas {
  const canvas = new Canvas();
  const doc = new CanvasDocument();
  const v1 = new CanvasDocumentV1();
  canvas.setId(makeUuid2l(id));
  v1.setItemsList(itemsList);
  doc.setV1(v1);
  canvas.setDocument(doc);
  return canvas;
}

export function makeLine2d(value: Partial<LineItem2d> = {}): CanvasItem {
  const item = new CanvasItem();
  const line2d = new ApiLineItem2d();
  line2d.setStartPosition(
    makeVector2d(value.startPosition?.x, value.startPosition?.y)
  );
  line2d.setEndPosition(
    makeVector2d(value.endPosition?.x, value.endPosition?.y)
  );
  line2d.setStrokeStyle(
    makeStrokeStyle(value.stroke?.thickness, value.stroke?.color)
  );
  line2d.setFillStyle(makeFillStyle(value.fill?.color));
  line2d.setStartShape(makeLineEndShape(value.startShape));
  line2d.setEndShape(makeLineEndShape(value.endShape));
  item.setLine2d(line2d);
  return item;
}

export function makeOval2d(value: Partial<OvalItem2d> = {}): CanvasItem {
  const item = new CanvasItem();
  const oval2d = new ApiOvalItem2d();
  oval2d.setTopLeft(
    makeVector2d(value.topLeftPosition?.x, value.topLeftPosition?.y)
  );
  oval2d.setBottomRight(
    makeVector2d(value.bottomRightPosition?.x, value.bottomRightPosition?.y)
  );
  oval2d.setStrokeStyle(
    makeStrokeStyle(value.stroke?.thickness, value.stroke?.color)
  );
  oval2d.setFillStyle(makeFillStyle(value.fill?.color));
  item.setOval(oval2d);
  return item;
}

export function makeFreeform2d(
  value: Partial<FreeformItem2d> = {}
): CanvasItem {
  const item = new CanvasItem();
  const freeform2d = new ApiFreeformItem2d();
  freeform2d.setPositionsList(
    value.positions?.map((p) => makeVector2d(p.x, p.y)) ?? []
  );
  freeform2d.setStrokeStyle(
    makeStrokeStyle(value.stroke?.thickness, value.stroke?.color)
  );
  freeform2d.setFillStyle(makeFillStyle(value.fill?.color));
  item.setFreeform(freeform2d);
  return item;
}

export function makePin2d(value: Partial<PinItem2d> = {}): CanvasItem {
  const item = new CanvasItem();
  const pin2d = new ApiPinItem2d();
  pin2d.setPosition(
    makeVector3f(value.position?.x, value.position?.y, value.position?.z)
  );
  pin2d.setPrimaryColor(makeRGBAi(value.primaryColor));
  pin2d.setAccentColor(makeRGBAi(value.accentColor));
  pin2d.setSceneItemId(makeUuid2l(value.sceneItemId));
  item.setPin(pin2d);
  return item;
}

export function makeCallout(value: Partial<CalloutItem> = {}): CanvasItem {
  const item = new CanvasItem();
  const callout = new ApiCalloutItem();
  callout.setAnchorPosition(
    makeVector3f(
      value.anchorPosition?.x,
      value.anchorPosition?.y,
      value.anchorPosition?.z
    )
  );
  callout.setTextPosition(
    makeVector2d(value.textPosition?.x, value.textPosition?.y)
  );
  callout.setPrimaryColor(makeRGBAi(value.primaryColor));
  callout.setAccentColor(makeRGBAi(value.accentColor));
  callout.setSceneItemId(makeUuid2l(value.sceneItemId));
  callout.setText(value.text ?? random.string());
  item.setCallout(callout);
  return item;
}

export function makeLineEndShape(
  shape: ArrowEndShape | CircleEndShape | DashEndShape = {
    type: 'arrow-end',
    width: 1,
    filled: true,
  }
): ApiEndShape {
  const s = new ApiEndShape();

  if (shape.type === 'arrow-end') {
    const a = new ApiArrowEndShape();
    a.setFilled(shape.filled);
    a.setWidth(shape.width);
    s.setArrow(a);
  }

  if (shape.type === 'circle-end') {
    const c = new ApiCircleEndShape();
    c.setFilled(shape.filled);
    c.setDiameter(shape.diameter);
    s.setCircle(c);
  }

  if (shape.type === 'dash-end') {
    const d = new ApiDashEndShape();
    d.setWidth(shape.width);
    s.setDash(d);
  }

  return s;
}

export function makeStrokeStyle(
  thickness = 4,
  color: Color.Color | string = Color.create(255, 255, 255)
): ApiStrokeStyle {
  const s = new ApiStrokeStyle();
  s.setThickness(thickness);
  s.setColor(makeRGBAi(color));
  return s;
}

export function makeFillStyle(
  color: Color.Color | string = Color.create(255, 255, 255)
): ApiFillStyle {
  const s = new ApiFillStyle();
  s.setColor(makeRGBAi(color));
  return s;
}

export function makeRGBAi(
  color: Color.Color | string = Color.create(255, 255, 255)
): RGBAi {
  const effectiveColor =
    typeof color === 'string' ? Color.fromHexString(color) : color;

  const c = new RGBAi();

  if (effectiveColor != null) {
    c.setA(effectiveColor.a);
    c.setG(effectiveColor.g);
    c.setB(effectiveColor.b);
  }

  return c;
}
