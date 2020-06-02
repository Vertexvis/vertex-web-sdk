import { Response, JsonResponse } from './responses';

export interface AttemptReconnect {
  timeToConnectionClose: string;
  reconnectWindowStartTime: string;
  reconnectWindowEndTime: string;
}

export const create = (
  timeToConnectionClose: string,
  reconnectWindowStartTime: string,
  reconnectWindowEndTime: string
): AttemptReconnect => ({
  timeToConnectionClose,
  reconnectWindowStartTime,
  reconnectWindowEndTime,
});

export const isReconnectMessage = (message: Response): boolean =>
  message.type === 'json' && message.json.type === 'AttemptReconnect';

export const toReconnectMessage = (message: JsonResponse): AttemptReconnect =>
  create(
    message.json.timeToConnectionClose,
    message.json.reconnectWindowStartTime,
    message.json.reconnectWindowEndTime
  );
