import { getDownEvent, getUpEvent, getMoveEvent } from '../interactionEvent';

describe(getDownEvent, () => {
  it('should return mousedown given false', () => {
    expect(getDownEvent(false)).toEqual('mousedown');
  });
  it('should return pointerdown given true', () => {
    expect(getDownEvent(true)).toEqual('pointerdown');
  });
});

describe(getUpEvent, () => {
  it('should return mouseup given false', () => {
    expect(getUpEvent(false)).toEqual('mouseup');
  });
  it('should return pointerup given true', () => {
    expect(getUpEvent(true)).toEqual('pointerup');
  });
});

describe(getMoveEvent, () => {
  it('should return mousemove given false', () => {
    expect(getMoveEvent(false)).toEqual('mousemove');
  });
  it('should return pointermove given true', () => {
    expect(getMoveEvent(true)).toEqual('pointermove');
  });
});
