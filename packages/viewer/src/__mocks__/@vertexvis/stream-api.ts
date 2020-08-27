const api = jest.genMockFromModule('@vertexvis/stream-api') as any;

export const StreamApi = api.StreamApi;

export const WebSocketClient = api.WebSocketClient;
