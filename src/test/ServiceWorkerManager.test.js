import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceWorkerManager } from '../ServiceWorkerManager.js';

describe('ServiceWorkerManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should register service worker', () => {
    const serviceWorkerFile = './service-worker-file.js';
    const serviceWorker = {
      register: vi.fn(),
      ready: Promise.resolve({ update: vi.fn() }),
    };

    vi.stubGlobal('location', { protocol: 'http', hostname: 'localhost' });
    vi.stubGlobal('XMLHttpRequest', { prototype: { open: vi.fn() } });

    // @ts-ignore
    const swm = new ServiceWorkerManager({ serviceWorker, overrideCalls: false });
    swm.register(serviceWorkerFile);

    expect(serviceWorker.register).toBeCalledWith(serviceWorkerFile, {
      type: 'module',
      updateViaCache: 'none',
    });
  });

  it('should log an error if Service Workers are not supported', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    vi.stubGlobal('location', { protocol: 'http', hostname: 'localhost' });
    vi.stubGlobal('XMLHttpRequest', { prototype: { open: vi.fn() } });

    // @ts-ignore
    const swm = new ServiceWorkerManager({ serviceWorker: null });
    swm.register();

    expect(consoleErrorSpy).toBeCalledWith('Service workers are not supported');
  });

  it('should log an error if serviceWorker registration fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    vi.stubGlobal('location', { protocol: 'http', hostname: 'localhost' });
    vi.stubGlobal('XMLHttpRequest', { prototype: { open: vi.fn() } });

    // @ts-ignore
    const swm = new ServiceWorkerManager({
      // @ts-ignore
      serviceWorker: {
        register: () => {
          throw Error('registration error');
        },
        // @ts-ignore
        ready: Promise.resolve({ update: vi.fn() }),
      },
    });

    swm.register();

    expect(consoleErrorSpy).toBeCalledWith(
      'Service worker registration failed: Error: registration error',
    );
  });

  it('should override fetch calls', async () => {
    const fetchStub = vi.fn();
    globalThis.fetch = fetchStub;
    const serviceWorker = {
      register: vi.fn(),
      ready: Promise.resolve({ update: vi.fn() }),
    };

    vi.stubGlobal('location', { protocol: 'http', hostname: 'localhost' });
    vi.stubGlobal('XMLHttpRequest', { prototype: { open: vi.fn() } });

    // @ts-ignore
    // eslint-disable-next-line no-new
    new ServiceWorkerManager({ serviceWorker });

    await fetch('http://test.com/test');

    expect(fetchStub).toHaveBeenCalledOnce();
  });

  it('should override fetch calls', async () => {
    const XHROpenStub = vi.fn();
    const serviceWorker = {
      register: vi.fn(),
      ready: Promise.resolve({ update: vi.fn() }),
    };
    vi.stubGlobal('location', { protocol: 'http', hostname: 'localhost' });
    vi.stubGlobal(
      'XMLHttpRequest',
      class {
        open = XHROpenStub;
      },
    );

    // @ts-ignore
    // eslint-disable-next-line no-new
    new ServiceWorkerManager({ serviceWorker });

    // eslint-disable-next-line no-undef
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://test.com/test');

    expect(XHROpenStub).toHaveBeenCalledOnce();
  });
});
