import { HttpClient } from '@vertexvis/network';

export type HttpClientProvider = () => HttpClient.HttpClient;
