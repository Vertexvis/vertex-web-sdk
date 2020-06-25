import { HttpResponse } from '@vertexvis/poc-network';

export class ApiException extends Error {
  public constructor(public response: HttpResponse.HttpResponse) {
    super();
    Object.setPrototypeOf(this, ApiException.prototype);

    try {
      const parsedResponse = JSON.parse(response.body);

      this.message = `${parsedResponse.error}: ${parsedResponse.message}`;
    } catch (e) {
      this.message = response.body;
    }
    this.name = this.constructor.name;
  }
}
