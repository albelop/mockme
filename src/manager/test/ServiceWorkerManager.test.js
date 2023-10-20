import { expect } from '@esm-bundle/chai';
import { stub, spy } from 'sinon';

import { ServiceWorkerManager } from '../ServiceWorkerManager.js';
import { getCurrentBaseUrl } from '../URLTools.js';

describe('ServiceWorkerManager', () => {
  const nativeFetch = globalThis.fetch;
  const nativeXHR = globalThis.XMLHttpRequest;

  afterEach(() => {
    globalThis.fetch = nativeFetch;
    globalThis.XMLHttpRequest = nativeXHR;
  });

  it('should register service worker', () => {
    const serviceWorkerFile = './service-worker-file.js';
    const serviceWorker = {
      register: stub(),
      ready: Promise.resolve({ update: stub() }),
    };

    // @ts-ignore
    const swm = new ServiceWorkerManager({
      serviceWorker,
      hostname: getCurrentBaseUrl({ url: new URL('http://localhost') }),
    });
    swm.register(serviceWorkerFile);

    expect(
      serviceWorker.register.calledOnceWithExactly(serviceWorkerFile, {
        type: 'module',
        updateViaCache: 'none',
      }),
    ).to.be.true;
  });

  it('should log an error if Service Workers are not supported', () => {
    const consoleErrorSpy = spy(console, 'error');

    try {
      const swm = new ServiceWorkerManager({
        serviceWorker: null,
        hostname: getCurrentBaseUrl({ url: new URL('http://localhost') }),
      });

      swm.register();

      expect(consoleErrorSpy.calledOnceWithExactly('Service workers are not supported')).to.be.true;
    } finally {
      consoleErrorSpy.restore();
    }
  });

  it('should log an error if serviceWorker registration fails', () => {
    const consoleErrorSpy = spy(console, 'error');

    try {
      const swm = new ServiceWorkerManager({
        // @ts-ignore
        serviceWorker: {
          register: () => {
            throw Error('registration error');
          },
          // @ts-ignore
          ready: Promise.resolve({ update: stub() }),
        },
        hostname: getCurrentBaseUrl({ url: new URL('http://localhost') }),
      });

      swm.register();

      expect(
        consoleErrorSpy.calledOnceWithExactly(
          'Service worker registration failed: Error: registration error',
        ),
      ).to.be.true;
    } finally {
      consoleErrorSpy.restore();
    }
  });

  it('should override fetch calls', async () => {
    const fetchStub = stub();
    globalThis.fetch = fetchStub;

    const serviceWorker = {
      register: stub(),
      ready: Promise.resolve({ update: stub() }),
    };

    // eslint-disable-next-line no-new
    new ServiceWorkerManager({
      serviceWorker,
      hostname: getCurrentBaseUrl({ url: new URL('http://localhost') }),
    });

    await fetch('http://test.com/test');

    expect(fetchStub.calledOnce).to.be.true;
  });

  it('should override XHR calls', async () => {
    const openStub = stub();
    globalThis.XMLHttpRequest = class {
      open = openStub;
    };

    const serviceWorker = {
      register: stub(),
      ready: Promise.resolve({ update: stub() }),
    };

    // eslint-disable-next-line no-new
    new ServiceWorkerManager({
      serviceWorker,
      hostname: getCurrentBaseUrl({ url: new URL('http://localhost') }),
    });

    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://test.com/test');

    expect(openStub.calledOnce).to.be.true;
  });
});
