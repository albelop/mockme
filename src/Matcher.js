import { match } from 'path-to-regexp';
import { httpCookie } from 'cookie-muncher';
import { mockSchema } from './schemas.js';

function compareObjects(a, b = {}) {
  let isEqual = true;
  const aKeys = Object.keys(a);

  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }

  while (isEqual && aKeys.length > 0) {
    const nextKey = aKeys.pop();

    if (!nextKey) {
      break;
    }

    isEqual = a[nextKey].toString() === b[nextKey].toString();
  }

  return isEqual;
}

// FIXME
// eslint-disable-next-line consistent-return
function containedObjects(a, b = {}) {
  const aKeys = Object.keys(a).map((str) => str.toLowerCase());
  const bKeys = Object.keys(b).map((str) => str.toLowerCase());

  // Match bKeys are included in aKeys
  const bKeysIncluded = bKeys.filter((bKey) => aKeys.includes(bKey)).length === bKeys.length;

  if (!bKeysIncluded) {
    return false;
  }

  // Match values
  if (bKeysIncluded) {
    const bKeysLowered = Object.keys(b).reduce((result, key) => {
      // eslint-disable-next-line no-param-reassign
      result[key.toLowerCase()] = b[key];
      return result;
    }, {});
    const aFiltered = Object.keys(a).reduce((result, key) => {
      if (
        bKeys.includes(key.toLowerCase()) &&
        a[key].toString() === bKeysLowered[key.toLowerCase()].toString()
      ) {
        // eslint-disable-next-line no-param-reassign
        result[key.toLowerCase()] = a[key].toString();
      }

      return result;
    }, {});

    return compareObjects(aFiltered, bKeysLowered);
  }
}

function matchConditions({ header, cookie, body, query, url }, request) {
  return (
    (request.conditions?.url ? compareObjects(url, request.conditions?.url) : true) &&
    containedObjects(header, request.conditions?.header) &&
    compareObjects(cookie, request.conditions?.cookie) &&
    compareObjects(body, request.conditions?.body) &&
    compareObjects(query, request.conditions?.query)
  );
}

async function parseRequest(request = {}) {
  if (request instanceof Request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const requestOptions = {
      path,
      method: request.method,
    };

    requestOptions.query = Object.fromEntries(
      // @ts-ignore
      new URLSearchParams(url.search)?.entries(),
    );

    const headers = Object.fromEntries(request.headers.entries());
    requestOptions.header = Object.keys(headers).reduce((result, headerKey) => {
      // eslint-disable-next-line no-param-reassign
      result[headerKey.toLowerCase()] = headers[headerKey];

      return result;
    }, {});

    // request body and header
    const originalRequest = {};

    try {
      originalRequest.body = await request.json();
    } catch {
      // do nothing
    } finally {
      originalRequest.header = Object.fromEntries(request.headers);
    }

    return { ...requestOptions, request: originalRequest };
  }
  return request;
}

const timeout = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function filterEmptyOptions(obj = {}) {
  const isNonEmptyArray = (value) => Array.isArray(value) && value.length !== 0;
  const isNonEmptyObject = (value) => typeof value === 'object' && Object.keys(value).length !== 0;
  const isNonEmptyValue = (value) =>
    typeof value !== 'object' && (Boolean(value) || value === 0 || value === false);
  const isNonEmpty = (value) =>
    isNonEmptyArray(value) || isNonEmptyObject(value) || isNonEmptyValue(value);

  return Object.keys(obj).reduce((result, key) => {
    if (isNonEmpty(obj[key])) {
      return {
        ...result,
        [key]: obj[key],
      };
    }

    return result;
  }, {});
}

function cookieParse(str = '') {
  return httpCookie.parse(str).reduce(
    (result, { name, value }) => ({
      ...result,
      [name]: value,
    }),
    {},
  );
}

export class Matcher {
  #mocks = [];

  #scenarios = [];

  #paths = [];

  #scenario;

  constructor(mocks = []) {
    const mocksIsAnArray = Array.isArray(mocks);
    let validShape = true;
    try {
      mocks.forEach((mock) => mockSchema.parse(mock));
    } catch (error) {
      validShape = false;
    }

    if (!mocksIsAnArray || !validShape) {
      throw new Error('Matcher expects an array of objects within a mock shape.');
    }

    const [parsedMocks, scenarios, paths] = Matcher.#prepareMocks(mocks);
    this.#mocks = parsedMocks;
    this.#scenarios = scenarios;
    this.#paths = paths;
  }

  get scenarios() {
    return this.#scenarios;
  }

  get paths() {
    return this.#paths;
  }

  static #prepareMocks(mocks = []) {
    const scenarios = new Set();
    const paths = new Set();
    const parsedMocks = mocks.map((mock) => {
      const { method, path } = mock.request;

      if (mock.scenario) scenarios.add(mock.scenario);
      paths.add(path);

      return {
        request: {
          ...mock.request,
          path: match(path, { decode: decodeURIComponent }),
          method: method.toUpperCase(),
        },
        response: mock.response || { status: 200, body: {} },
        delay: mock.delay || 0,
        scenario: mock.scenario,
      };
    });

    return [parsedMocks, [...scenarios], [...paths]];
  }

  async match(request = {}) {
    const options = await parseRequest(request);
    // @ts-ignore
    const { result, delay } = this.#findMock(options);

    return {
      response: result,
      delay,
      delayedResponse: async () => {
        if (delay) await timeout(delay);
        return result;
      },
    };
  }

  #findMock({
    method,
    path,
    header = {},
    cookie = '',
    body = {},
    query = {},
    scenario = this.#scenario,
    request = {},
  }) {
    const requestOptions = {
      header,
      cookie: cookieParse(cookie),
      body,
      query,
    };
    const mocks = this.#mocks.filter(
      ({ request: mockRequest }) =>
        mockRequest.path(path) &&
        mockRequest.method === method.toUpperCase() &&
        // @ts-ignore
        matchConditions(
          {
            ...requestOptions,
            url: mockRequest.path(path).params,
          },
          mockRequest,
        ),
    );

    const noScenarioMock = mocks.find((m) => !m.scenario);
    const inScenarioMock = mocks.find((m) => m.scenario === scenario);
    const mock = !scenario ? noScenarioMock : inScenarioMock || noScenarioMock;

    if (mock) {
      const { response, delay: mockDelay } = mock;
      let mockResponse;

      if (typeof response === 'function') {
        const responseOptions = {
          ...requestOptions,
          url: mock.request.path(path).params,
          // @ts-ignore
          body: request.body || {},
          // @ts-ignore
          header: request.header || {},
        };

        mockResponse = response(filterEmptyOptions(responseOptions));
      } else {
        mockResponse = response;
      }

      const {
        body: mockBody = {},
        status = 200,
        headers = {},
        delay: responseDelay,
      } = mockResponse;

      // @ts-ignore
      const result = Response.json(mockBody, {
        status,
        headers: new Headers(headers),
      });

      return { result, delay: responseDelay || mockDelay };
    }
    return { result: Response.error() };
  }

  // @ts-ignore
  set scenario(scenario) {
    if (scenario !== undefined && !this.scenarios.includes(scenario)) {
      throw new Error(
        `Scenario ${scenario} is not a valid one. Valid scenario options are ${this.scenarios.join()}.`,
      );
    }

    this.#scenario = scenario;
  }
}
