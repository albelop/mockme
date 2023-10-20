import { isEqual } from 'lodash-es';
import { match } from 'path-to-regexp';
import { mockSchema } from '../schemas.js';
import { isContainedMap } from './utils.js';
import { RequestParser } from './parsers/RequestParser.js';

export class Matcher {
  #mocks = [];

  /** @type {Map<string, boolean>} */
  #scenarios;

  /** @type {Map<string, string>} */
  #cookies;

  constructor(mocks = []) {
    if (Matcher.#isNotArray(mocks) || Matcher.#notFollowTheSchemas(mocks)) {
      throw new Error('Matcher expects an array of objects within a mock shape.');
    }

    this.#cookies = new Map();
    this.#scenarios = Matcher.#getScenarios(mocks);
    this.#mocks = Matcher.#prepareMocks(mocks);
  }

  static #isNotArray(mocks) {
    return !Array.isArray(mocks);
  }

  static #notFollowTheSchemas(mocks) {
    try {
      mocks.forEach((mock) => mockSchema.parse(mock));
    } catch (error) {
      return true;
    }

    return false;
  }

  /**
   * Obtains the list of scenarios declared in the mocks.
   *
   * @param mocks
   * @returns {Map<string, boolean>}
   */
  static #getScenarios(mocks) {
    const scenarios = new Set();

    mocks.forEach((mock) => {
      if (mock.scenario) {
        scenarios.add(mock.scenario);
      }
    });

    return new Map([...scenarios].sort().map((scenario) => [scenario, false]));
  }

  get scenarios() {
    return this.#scenarios;
  }

  get cookies() {
    return this.#cookies;
  }

  static #prepareMocks(mocks = []) {
    return mocks.map((mock) => Matcher.#normalizeMock(mock));
  }

  static #normalizeMock({ request, response, delay = 0, scenario }) {
    const responseFunction =
      typeof response === 'function' ? response : () => Promise.resolve(response);

    return {
      request: {
        method: request.method,
        pathMatch: match(request.path, { decode: decodeURIComponent }),
        body: request.body,
        queryParams: new Map(
          Object.entries(request.conditions?.query ?? {}).map(([name, value]) => [
            name,
            JSON.parse(value),
          ]),
        ),
        headers: new Map(
          Object.entries(request.conditions?.header ?? {}).map(([name, value]) => [
            name,
            value.toString(),
          ]),
        ),
        cookies: new Map(
          Object.entries(request.conditions?.cookie ?? {}).map(([name, value]) => [
            name,
            value.toString(),
          ]),
        ),
      },

      getResponse: async (...args) =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              responseFunction(...args).then(({ body, status, headers = {} }) =>
                resolve(
                  Response.json(body, {
                    status,
                    headers: new Headers(headers),
                  }),
                ),
              ),
            delay,
          );
        }),

      scenario,
    };
  }

  async match(request = {}) {
    const normalizedRequest = await RequestParser.parse(request);

    return this.#findMock(normalizedRequest, new Map());
  }

  #findMock(request) {
    const mocks = this.#mocks
      .filter((mock) => mock.request.pathMatch(request.path))
      .filter((mock) => mock.request.method === request.method)
      .filter((mock) => isEqual(mock.request.body, request.body))
      .filter((mock) => isContainedMap(mock.request.queryParams, request.queryParams))
      .filter((mock) => isContainedMap(mock.request.headers, request.headers))
      .filter((mock) => isContainedMap(mock.request.cookies, this.#cookies));

    const noScenarioMock = mocks.find((mock) => !mock.scenario);
    const inScenarioMock = mocks.find((mock) => this.#scenarios.get(mock.scenario));

    return inScenarioMock || noScenarioMock;
  }

  enableScenario(scenario) {
    this.#checkScenario(scenario);

    this.#scenarios.set(scenario, true);
  }

  disableScenario(scenario) {
    this.#checkScenario(scenario);

    this.#scenarios.set(scenario, false);
  }

  setCookie(name, value) {
    this.#cookies.set(name, value);
  }

  removeCookie(name) {
    this.#cookies.delete(name);
  }

  #checkScenario(scenario) {
    if (scenario !== undefined && !this.scenarios.has(scenario)) {
      throw new Error(`The specified scenario ${scenario} is not used by the loaded mocks.`);
    }
  }
}
