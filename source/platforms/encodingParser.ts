/**
 * Verifies that the given encoding is a valid BufferEncoding.
 * @throws in case the encoding is unsupported.
 */
export function encodingParser(encoding: string): BufferEncoding {
  if (Buffer.isEncoding(encoding)) {
    return encoding as BufferEncoding
  }
  throw new Error(`Unsupported buffer encoding ${encoding}`)
}
