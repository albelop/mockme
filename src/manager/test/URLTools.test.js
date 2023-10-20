import { expect } from '@esm-bundle/chai';

import { formatUrl, getCurrentBaseUrl, getUrl, replaceUrl } from '../URLTools.js';

describe('URL Tools', () => {
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
      const result = getUrl('http://test.com');

      expect(result).instanceOf(URL);
    });
  });

  describe('replaceUrl', () => {
    it('should replace protocol+hostname+port with replacement', () => {
      const result = replaceUrl('http://test.com:1000/test', 'https://replace.com:2000');

      expect(result.destinationURL).to.eq('https://replace.com:2000/test');
    });

    it('should return destinationURL and requestHost', () => {
      const result = replaceUrl('http://test.com:1000/test', 'https://replace.com:2000');

      expect(result.destinationURL).to.not.be.undefined;
      expect(result.requestHost).to.not.be.undefined;
    });

    it('should use global location if no origin passed', () => {
      const url = new URL('http://localhost:200');

      expect(replaceUrl('http://test.com:1000/test', undefined, { url })).to.eql({
        destinationURL: 'http://localhost:200/test',
        requestHost: 'http://test.com:1000',
      });
    });
  });

  describe('getCurrentBaseUrl', () => {
    it('should return the current base url from the globalThis.location', () => {
      const url = new URL('http://localhost:300');

      expect(getCurrentBaseUrl({ url })).to.eq('http://localhost:300');
    });

    it('should return the current base url from the globalThis.location without port', () => {
      const url = new URL('http://localhost');

      expect(getCurrentBaseUrl({ url })).to.eq('http://localhost');
    });
  });

  describe('formatUrl', () => {
    it('should format the url with protocol, hostname and port', () => {
      expect(formatUrl({ protocol: 'p', hostname: 'h', port: '2' })).to.eq('p://h:2');
    });

    it('should format the url with protocol, hostname', () => {
      expect(formatUrl({ protocol: 'p', hostname: 'h' })).to.eq('p://h');
    });
  });
});
