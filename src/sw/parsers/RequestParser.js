const toJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export class RequestParser {
  /** @param {Request} request */
  // eslint-disable-next-line class-methods-use-this
  static async parse(request) {
    if (!(request instanceof Request)) {
      throw new Error('The request value is not a Request');
    }

    return {
      request,
      path: RequestParser.#getPath(request),
      method: RequestParser.#getMethod(request),
      queryParams: RequestParser.#getQueryParams(request),
      headers: RequestParser.#getHeaders(request),
      body: await RequestParser.#getBody(request),
    };
  }

  /**
   * @param {Request} request
   * @returns {URL}
   */
  static #getUrl(request) {
    return new URL(request.url);
  }

  /**
   * @param {Request} request
   * @returns {string}
   */
  static #getPath(request) {
    return RequestParser.#getUrl(request).pathname;
  }

  /**
   * @param {Request} request
   * @returns {string}
   */
  static #getMethod(request) {
    return request.method.toUpperCase();
  }

  /**
   * @param {Request} request
   * @returns {Map<string, string>}
   */
  static #getQueryParams(request) {
    const searchParams = new URLSearchParams(RequestParser.#getUrl(request).search);

    return new Map([...searchParams.entries()].map(([key, value]) => [key, toJson(value)]));
  }

  /**
   * @param {Request} request
   * @returns {Map<string, string>}
   */
  static #getHeaders(request) {
    return new Map(
      [...request.headers.entries()].map(([key, value]) => [key.toLowerCase(), value]),
    );
  }

  /**
   * @param {Request}request
   * @returns {Promise<void|*|FormData>}
   */
  static async #getBody(request) {
    const headers = RequestParser.#getHeaders(request);

    if (headers.has('content-type')) {
      const contentType = headers.get('content-type');

      if (contentType.includes('text/plain')) {
        return request.text();
      }

      if (contentType.includes('multipart/form-data')) {
        return request.formData();
      }

      return request.json();
    }

    return Promise.resolve();
  }
}
