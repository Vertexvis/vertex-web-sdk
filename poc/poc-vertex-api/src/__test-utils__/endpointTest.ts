import {
  HttpRequestMethod,
  HttpRequest,
  HttpResponse,
  HttpClient,
  HttpHeaders,
} from '@vertexvis/poc-network';
import { Uri } from '@vertexvis/utils';

type Assertion<T> = (data: T) => void;
type Executor<T> = (client: HttpClient.HttpClient) => Promise<T>;

export class EndpointTest {
  private requestAssertion?: Assertion<HttpRequest.HttpRequest>;
  private responseAssertion: Assertion<HttpResponse.HttpResponse>[] = [];

  private stubbedResponse: Partial<
    Pick<HttpResponse.HttpResponse, 'body' | 'headers' | 'status'>
  > = {};

  public stubResponse(
    response: Partial<
      Pick<HttpResponse.HttpResponse, 'body' | 'headers' | 'status'>
    >
  ): EndpointTest {
    this.stubbedResponse = { ...this.stubbedResponse, ...response };
    return this;
  }

  public stubResponseBodyAsJson(obj: object): EndpointTest {
    return this.stubResponse({ body: JSON.stringify(obj) });
  }

  public stubResponseStatus(status: number): EndpointTest {
    return this.stubResponse({ status });
  }

  public stubResponseHeaders(headers: HttpHeaders.HttpHeaders): EndpointTest {
    return this.stubResponse({ headers });
  }

  public verifyRequest(
    method: HttpRequestMethod,
    path: string,
    body?: any
  ): EndpointTest {
    this.requestAssertion = (request: HttpRequest.HttpRequest) => {
      const pathUri = Uri.parse(path);
      const requestUri = Uri.parse(request.url);

      expect(request.method).toEqual(method);
      expect(requestUri).toEqual(pathUri);

      if (body != null) {
        expect(request.body).toEqual(body);
      }
    };
    return this;
  }

  public verifyResponse(
    assertion: Assertion<HttpResponse.HttpResponse>
  ): EndpointTest {
    this.responseAssertion.push(assertion);
    return this;
  }

  public async execute<T>(executor: Executor<T>): Promise<T> {
    const mockClient = this.createMockClient();
    return executor(mockClient);
  }

  private createMockClient(): HttpClient.HttpClient {
    return request => {
      const response = {
        request,
        body: '',
        status: 200,
        headers: {},
        ...this.stubbedResponse,
      };

      if (this.requestAssertion != null) {
        this.requestAssertion(request);
      }

      this.responseAssertion.forEach(assertion => assertion(response));

      return Promise.resolve(response);
    };
  }
}
