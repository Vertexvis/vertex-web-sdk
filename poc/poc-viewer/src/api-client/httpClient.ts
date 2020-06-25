import { HttpClient } from '@vertexvis/poc-network';

export type HttpClientProvider = () => HttpClient.HttpClient;
