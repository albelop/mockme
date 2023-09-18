import { match } from "path-to-regexp";
import { mockSchema } from "./schemas.js";
import cookieParser from "cookie";

export default class Matcher {
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

  match(request = {}) {
    const options = parseRequest(request);
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
    headers = {},
    cookie = "",
    body = {},
    queryParams = {},
    query = {},
    params = {},
    scenario = this.#scenario,
  }) {
    const _cookie = cookieParser.parse(cookie);
    const mocks = this.#mocks.filter(
      ({ request }) =>
        request.path(path) &&
        request.method === method.toUpperCase() &&
        // @ts-ignore
        matchConditions(
          {
            headers,
            cookie: _cookie,
            body,
            queryParams,
            query,
            params,
            url: request.path(path).params,
          },
          request
        )
    );

    const noScenarioMock = mocks.find((m) => !m.scenario);
    const inScenarioMock = mocks.find((m) => m.scenario === scenario);

    const mock = !scenario ? noScenarioMock : inScenarioMock || noScenarioMock;

    if (mock) {
      const { response, delay, request } = mock;
      let _response;

      if (typeof response === "function") {
        const { params } = mock.request.path(path);
        const responseOptions = { params };
        if (request.body) {
          responseOptions.body = request.body;
        }
        if (request.conditions?.header) {
          responseOptions.headers = request.conditions.header;
        }

        if (request.conditions?.cookie) {
          responseOptions.cookies = request.conditions.cookie;
        }

        _response = response(responseOptions);
      } else {
        _response = response;
      }

      const { body = {}, status = 200, headers = {} } = _response;

      // @ts-ignore
      const result = Response.json(body, {
        status,
        headers: new Headers(headers),
      });

      return { result, delay };
    } else {
      return { result: Response.error() };
    }
  }

  set scenario(scenario) {
    if (this.#scenarios.includes(scenario) || scenario === undefined) {
      this.#scenario = scenario;
    } else {
      throw new Error(
        `Scenario ${scenario} is not a valid one. Valid scenario options are ${this.scenarios.join()}.`
      );
    }
  }
}

function matchConditions(
  { headers, cookie, body, query, queryParams, params, url },
  request
) {
  return (
    (request.conditions?.url
      ? compareObjects(url, request.conditions?.url)
      : true) &&
    compareObjects(headers, request.conditions?.header) &&
    compareObjects(cookie, request.conditions?.cookie) &&
    compareObjects(body, request.conditions?.body) &&
    compareObjects(query, request.conditions?.query) &&
    compareObjects(queryParams, request.conditions?.queryParam) &&
    compareObjects(params, request.conditions?.param)
  );
}

function compareObjects(a, b = {}) {
  let isEqual = true;
  const aKeys = Object.keys(a);

  if (aKeys.length !== Object.keys(b).length) return false;

  while (isEqual && aKeys.length > 0) {
    const nextKey = aKeys.pop();
    if (!nextKey) break;
    isEqual = a[nextKey].toString() === b[nextKey].toString();
  }

  return isEqual;
}
function parseRequest(request = {}) {
  if (request instanceof Request) {
    const path = new URL(request.url).pathname;
    // @ts-ignore
    const queryParams = new URLSearchParams(request.url.search);
    return {
      path,
      method: request.method,
      queryParams: Object.fromEntries(queryParams.entries()),
      // headers: Object.fromEntries(request.headers.entries()),
    };
  } else {
    return request;
  }
}
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}