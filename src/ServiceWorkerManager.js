import { getUrl, replaceUrl } from './URLTools.js';
import { changeScenario } from './serviceWorker.js';

const MOCKME_HOSTNAME_HEADER = 'X-Mockme-Hostname';

/**
 * Service Worker Manager
 */
export class ServiceWorkerManager {
  /** @type {Console} */
  #console;

  /** @type {ServiceWorkerContainer} */
  #serviceWorker;

  /** @type { String } */
  #hostname;

  /**
   * @param {Object} [options]
   * @param {Console} [options.console]
   * @param {ServiceWorkerContainer} [options.serviceWorker]
   * @param {String} [options.hostname]
   * @param {Boolean} [options.overrideCalls]
   */
  constructor({
    console = globalThis.console,
    // eslint-disable-next-line no-undef
    serviceWorker = navigator.serviceWorker,
    hostname = `${globalThis.location.protocol}//${globalThis.location.hostname}${
      globalThis.location.port ? `:${globalThis.location.port}` : ''
    }`,
  } = {}) {
    this.#console = console;
    this.#serviceWorker = serviceWorker;

    // Store current hostname with port
    this.#hostname = hostname;

    // check if there is a service worker update
    this.#serviceWorker?.ready.then((registration) => registration.update());

    this.#overrideRequestCalls();
  }

  #overrideRequestCalls() {
    this.#overrideXHR();
    this.#overrideFetch();
  }

  #overrideXHR() {
    // eslint-disable-next-line no-undef
    const { open } = XMLHttpRequest.prototype;
    const originHostname = this.#hostname;

    // eslint-disable-next-line no-undef
    XMLHttpRequest.prototype.open = function wrappedOpen(method, url, ...rest) {
      const { destinationURL, requestHost } = replaceUrl(url, originHostname);
      this.withCredentials = true;

      open.call(this, method, destinationURL, ...rest);

      if (destinationURL !== url) {
        this.setRequestHeader(MOCKME_HOSTNAME_HEADER, requestHost);
      }
    };
  }

  #overrideFetch() {
    const originHostname = this.#hostname;
    const { fetch } = globalThis;

    globalThis.fetch = function wrappedFetch(input, init = {}) {
      if (input.toString().startsWith('.')) {
        return fetch.call(globalThis, input, init);
      }

      const url = getUrl(input);
      const { destinationURL, requestHost } = replaceUrl(url, originHostname);

      if (input instanceof Request) {
        input.headers.set(MOCKME_HOSTNAME_HEADER, requestHost);
        return fetch.call(globalThis, destinationURL, input);
      }

      const headers = new Headers(init.headers);
      headers.set(MOCKME_HOSTNAME_HEADER, requestHost);

      return fetch.call(globalThis, destinationURL, { ...init, headers });
    };
  }

  /**
   * Registers the Service Worker.
   *
   * @returns {Promise<void>}
   */
  async register(serviceWorkerFile = '/sw.js') {
    if (this.#serviceWorker) {
      try {
        await this.#serviceWorker.register(serviceWorkerFile, {
          type: 'module',
          updateViaCache: 'none',
        });
      } catch (error) {
        this.#console.error(`Service worker registration failed: ${error}`);
      }
    } else {
      this.#console.error(`Service workers are not supported`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  selectScenario(scenario) {
    changeScenario(scenario);
  }
}
