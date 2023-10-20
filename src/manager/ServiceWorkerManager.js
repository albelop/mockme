import { getUrl, replaceUrl, getCurrentBaseUrl } from './URLTools.js';
import { MessageBroker } from '../sw/MessageBroker.js';

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

  #messageBroker;

  /**
   * @param {Object} [options]
   * @param {Console} [options.console]
   * @param {ServiceWorkerContainer} [options.serviceWorker]
   * @param {String} [options.hostname]
   */
  constructor({
    console = globalThis.console,
    // eslint-disable-next-line no-undef
    serviceWorker = navigator.serviceWorker,
    hostname = getCurrentBaseUrl(),
    messageBroker = new MessageBroker(),
  } = {}) {
    this.#console = console;
    this.#serviceWorker = serviceWorker;
    this.#messageBroker = messageBroker;

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

        const done = setInterval(() => this.#messageBroker.askForConfig(), 10);

        await new Promise((resolve) => {
          this.#messageBroker.addSendConfigListener((config) => {
            clearTimeout(done);
            resolve(config);
          });
        });
      } catch (error) {
        this.#console.error(`Service worker registration failed: ${error}`);
      }
    } else {
      this.#console.error(`Service workers are not supported`);
    }
  }
}
