/**
 * A `BinaryReader` represents a view and offset for iteratively reading data
 * from an `ArrayBuffer`.
 *
 * Readers are created by calling the `BinaryReader.fromArrayBuffer()` method,
 * and passed to helper methods such as `BinaryReader.readInt32()` to read data
 * from the buffer. These helpers return a new `BinaryReader` that contains an
 * adjusted offset and the read value, and can further be passed to additional
 * helpers.
 *
 * @example // Reading from an `ArrayBuffer`
 *
 * const reader = BinaryReader.fromArrayBuffer(buffer);
 * const messageLength = BinaryReader.readInt32(reader);
 * console.log(messageLength.value); // 11
 *
 * const message = BinaryReader.readUtf8String(messageLength.value, messageLength);
 * console.log(message.value); // Hello world
 */
export interface BinaryReader {
  offset: number;
  data: DataView;
}

interface BinaryReaderValue<T> extends BinaryReader {
  value: T;
}

/**
 * Returns a new `BinaryReader` for an `ArrayBuffer`.
 */
export const fromArrayBuffer = (buffer: ArrayBuffer): BinaryReader => {
  return { offset: 0, data: new DataView(buffer) };
};

/**
 * Returns a `BinaryReader` that contains the read Int32 value at the given
 * reader's offset. The returned reader will have its offset adjusted so it can
 * be passed to the next helper.
 */
export const readInt32 = (reader: BinaryReader): BinaryReaderValue<number> => {
  const value = reader.data.getInt32(reader.offset);
  return { ...reader, offset: reader.offset + 4, value };
};

/**
 * Returns a `BinaryReader` that contains the read UTF-8 string at the given
 * reader's offset. The returned reader will have its offset adjusted so it can
 * be passed to the next helper.
 */
export const readUtf8String = (
  length: number,
  reader: BinaryReader
): BinaryReaderValue<string> => {
  const value = String.fromCharCode.apply(
    null,
    Array.from(new Uint8Array(reader.data.buffer, reader.offset, length))
  );
  return { ...reader, offset: reader.offset + length, value };
};

/**
 * Returns a `BinaryReader` that contains the a signed `Int8Array` start from
 * the given reader's offset to the given length. The returned reader will have
 * its offset adjusted so it can be passed to the next helper.
 */
export const readInt8Array = (
  length: number,
  reader: BinaryReader
): BinaryReaderValue<Int8Array> => {
  const value = new Int8Array(reader.data.buffer, reader.offset, length);
  return { ...reader, offset: reader.offset + length, value };
};

/**
 * Returns a `BinaryReader` that contains the a signed `Int8Array` sliced from
 * the start of the reader's offset to offset + length. The new reader value has
 * an offset of zero, so downstream operations will not bee effected by the
 * previous offset
 */
export const sliceInt8Array = (
  length: number,
  reader: BinaryReader
): BinaryReaderValue<Int8Array> => {
  const value = new Int8Array(
    reader.data.buffer.slice(reader.offset, length + reader.offset)
  );

  return { ...reader, offset: 0, value };
};
