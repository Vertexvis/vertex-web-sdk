import { vertexvis } from '@vertexvis/frame-streaming-protos';

import { currentDateAsProtoTimestamp } from '../../time';
import {
  AnimationCompletedEvent,
  EventMessage,
  RequestMessage,
} from '../../types';

type Metadata = Partial<Pick<RequestMessage, 'sentAtTime'>>;

type Event = vertexvis.protobuf.stream.IStreamEvent;

function event(req: Event, meta?: Metadata): EventMessage {
  return {
    sentAtTime: currentDateAsProtoTimestamp(),
    event: {
      ...req,
    },
    ...meta,
  };
}

export function animationCompleted(id: string): EventMessage {
  const def: AnimationCompletedEvent = {
    animationId: { hex: id },
  };
  return event({
    animationCompleted: {
      ...def,
    },
  });
}
