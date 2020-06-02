import * as BinaryReader from '../binaryReader';

const buffer = new ArrayBuffer(4 + 16);
const view = new DataView(buffer);
view.setInt32(0, 1);
view.setUint8(4, 'b'.charCodeAt(0));

describe(BinaryReader.fromArrayBuffer, () => {
  const reader = BinaryReader.fromArrayBuffer(buffer);

  it('creates a binary reader with offset at 0', () => {
    expect(reader.offset).toEqual(0);
  });
});

describe(BinaryReader.readInt32, () => {
  const reader = BinaryReader.fromArrayBuffer(buffer);

  it('reads next integer', () => {
    const result = BinaryReader.readInt32(reader);
    expect(result.value).toEqual(1);
  });

  it('advances the offset by 4', () => {
    const result = BinaryReader.readInt32(reader);
    expect(result.offset).toEqual(4);
  });
});

describe(BinaryReader.readUtf8String, () => {
  const reader = BinaryReader.readInt32(BinaryReader.fromArrayBuffer(buffer));

  it('reads a utf8 string of the given length', () => {
    const result = BinaryReader.readUtf8String(1, reader);
    expect(result.value).toEqual('b');
  });

  it('advances the offset by the length', () => {
    const result = BinaryReader.readUtf8String(1, reader);
    expect(result.offset).toEqual(reader.offset + 1);
  });
});

describe(BinaryReader.readInt8Array, () => {
  const reader = BinaryReader.readInt32(BinaryReader.fromArrayBuffer(buffer));

  it('reads an int8 array of the given length', () => {
    const result = BinaryReader.readInt8Array(1, reader);
    const value = String.fromCharCode.apply(null, Array.from(result.value));
    expect(value).toEqual('b');
  });

  it('advances the offset by the length', () => {
    const result = BinaryReader.readInt8Array(1, reader);
    expect(result.offset).toEqual(reader.offset + 1);
  });
});

describe(BinaryReader.sliceInt8Array, () => {
  const reader = BinaryReader.readInt32(BinaryReader.fromArrayBuffer(buffer));

  it('creates a new segment, resetting the offset to 0', () => {
    const result = BinaryReader.sliceInt8Array(1, reader);
    expect(result.offset).toEqual(0);
  });
});
