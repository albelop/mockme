import { match } from "path-to-regexp";
import { mockSchema } from "./schemas.js";
import { httpCookie } from "cookie-muncher";

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
      throw new Error(
        "Matcher expects an array of objects within a mock shape."
      );
    }

    const [parsedMocks, scenarios, paths] = this.#prepareMocks(mocks);
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

  #prepareMocks(mocks = []) {
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
    cookie = "",
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
      ({ request }) =>
        request.path(path) &&
        request.method === method.toUpperCase() &&
        // @ts-ignore
        matchConditions(
          {
            ...requestOptions,
            url: request.path(path).params,
          },
          request
        )
    );

    const noScenarioMock = mocks.find((m) => !m.scenario);
    const inScenarioMock = mocks.find((m) => m.scenario === scenario);
    const mock = !scenario ? noScenarioMock : inScenarioMock || noScenarioMock;

    if (mock) {
      const { response, delay: mockDelay } = mock;
      let _response;

      if (typeof response === "function") {
        const responseOptions = {
          ...requestOptions,
          url: mock.request.path(path).params,
          // @ts-ignore
          body: request.body || {},
          // @ts-ignore
          header: request.header || {},
        };

        _response = response(filterEmptyOptions(responseOptions));
      } else {
        _response = response;
      }

      const {
        body = {},
        status = 200,
        headers = {},
        delay: responseDelay,
      } = _response;

      // @ts-ignore
      const result = Response.json(body, {
        status,
        headers: new Headers(headers),
      });

      return { result, delay: responseDelay || mockDelay };
    } else {
      return { result: Response.error() };
    }
  }

  // @ts-ignore
  set scenario(scenario) {
    if (scenario !== undefined && !this.scenarios.includes(scenario)) {
      throw new Error(
        `Scenario ${scenario} is not a valid one. Valid scenario options are ${this.scenarios.join()}.`
      );
    }

    this.#scenario = scenario;
  }
}

function matchConditions({ header, cookie, body, query, url }, request) {
  return (
    (request.conditions?.url
      ? compareObjects(url, request.conditions?.url)
      : true) &&
    containedObjects(header, request.conditions?.header) &&
    compareObjects(cookie, request.conditions?.cookie) &&
    compareObjects(body, request.conditions?.body) &&
    compareObjects(query, request.conditions?.query)
  );
}

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

function containedObjects(a, b = {}) {
  const aKeys = Object.keys(a).map((str) => str.toLowerCase());
  const bKeys = Object.keys(b).map((str) => str.toLowerCase());

  // Match bKeys are included in aKeys
  const bKeysIncluded =
    bKeys.filter((bKey) => aKeys.includes(bKey)).length === bKeys.length;

  if (!bKeysIncluded) {
    return false;
  }

  // Match values
  if (bKeysIncluded) {
    const bKeysLowered = Object.keys(b).reduce((result, key) => {
      result[key.toLowerCase()] = b[key];
      return result;
    }, {});
    const aFiltered = Object.keys(a).reduce((result, key) => {
      if (
        bKeys.includes(key.toLowerCase()) &&
        a[key].toString() === bKeysLowered[key.toLowerCase()].toString()
      ) {
        result[key.toLowerCase()] = a[key].toString();
      }

      return result;
    }, {});

    return compareObjects(aFiltered, bKeysLowered);
  }
}

async function parseRequest(request = {}) {
  if (request instanceof Request) {
    const path = new URL(request.url).pathname;

    const requestOptions = {
      path,
      method: request.method,
    };

    requestOptions.query = Object.fromEntries(
      // @ts-ignore
      new URLSearchParams(request.url.search)?.entries()
    );

    const headers = Object.fromEntries(request.headers.entries());
    requestOptions.header = Object.keys(headers).reduce((result, headerKey) => {
      result[headerKey.toLowerCase()] = headers[headerKey];

      return result;
    }, {});

    // request body and header
    const originalRequest = {};

    try {
      originalRequest.body = await request.json();
    } catch {
      // do nothin
    } finally {
      originalRequest.header = Object.fromEntries(request.headers);
    }

    return { ...requestOptions, request: originalRequest };
  } else {
    return request;
  }
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function filterEmptyOptions(obj = {}) {
  return Object.keys(obj).reduce((result, key) => {
    if (Array.isArray(obj[key]) && obj[key].length !== 0) {
      result[key] = obj[key];
    } else if (
      typeof obj[key] === "object" &&
      Object.keys(obj[key]).length !== 0
    ) {
      result[key] = obj[key];
    } else if (
      typeof obj[key] !== "object" &&
      (Boolean(obj[key]) || obj[key] === 0 || obj[key] === false)
    ) {
      result[key] = obj[key];
    }

    return result;
  }, {});
}

function cookieParse(str = "") {
  return httpCookie.parse(str).reduce((result, { name, value }) => {
    result[name] = value;

    return result;
  }, {});
}
