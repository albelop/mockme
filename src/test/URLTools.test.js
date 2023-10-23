import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatUrl, getCurrentBaseUrl, getUrl, replaceUrl } from '../URLTools.js';

describe('URL Tools', () => {
  afterEach(() => {
    vi.unstubAllGlobals;
  });

  describe('getUrl', () => {
    it('should return URL instance for a Request', () => {
      const result = getUrl(new Request('http://test.com'));
      expect(result).instanceOf(URL);
    });

    it('should return URL instance for a URL', () => {
      const result = getUrl(new URL('http://test.com'));
      expect(result).instanceOf(URL);
    });

    it('should return URL instance for a String', () => {
      vi.stubGlobal('location', { protocol: 'http:', hostname: 'localhost', port: '200' });
      const result = getUrl('http://test.com');
      expect(result).instanceOf(URL);
    });
  });

  describe('replaceUrl', () => {
    it('should replace protocol+hostname+port with replacement', () => {
      const result = replaceUrl('http://test.com:1000/test', 'https://replace.com:2000');

      expect(result.destinationURL).toBe('https://replace.com:2000/test');
    });

    it('should return destinationURL and requestHost', () => {
      const result = replaceUrl('http://test.com:1000/test', 'https://replace.com:2000');

      expect(result).toHaveProperty('destinationURL');
      expect(result).toHaveProperty('requestHost');
    });

    it('should use global location if no origin passed', () => {
      // @ts-ignore
      vi.stubGlobal('location', { protocol: 'http:', hostname: 'localhost', port: '200' });
      expect(replaceUrl('http://test.com:1000/test')).toEqual({
        destinationURL: 'http://localhost:200/test',
        requestHost: 'http://test.com:1000',
      });
    });
  });

  describe('getCurrentBaseUrl', () => {
    it('should return the current base url from the globalThis.location', () => {
      // @ts-ignore
      vi.stubGlobal('location', { protocol: 'http:', hostname: 'localhost', port: '300' });

      expect(getCurrentBaseUrl()).toBe('http://localhost:300');
    });

    it('should return the current base url from the globalThis.location without port', () => {
      // @ts-ignore
      vi.stubGlobal('location', { protocol: 'http:', hostname: 'localhost' });

      expect(getCurrentBaseUrl()).toBe('http://localhost');
    });
  });

  describe('formatUrl', () => {
    it('should format the url with protocol, hostname and port', () => {
      expect(formatUrl({ protocol: 'p', hostname: 'h', port: '2' })).toBe('p://h:2');
    });

    it('should format the url with protocol, hostname', () => {
      expect(formatUrl({ protocol: 'p', hostname: 'h' })).toBe('p://h');
    });
  });
});
