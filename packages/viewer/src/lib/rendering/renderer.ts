/**
 * An asynchronous function that generates a frame from a request object.
 */
export type FrameRenderer<I, O> = (req: I) => Promise<O>;
