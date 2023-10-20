import { expect } from '@esm-bundle/chai';
import { isEqual } from 'lodash-es';

import { RequestParser } from '../RequestParser.js';

describe('RequestParser', () => {
  describe('parse', () => {
    it(`should throw an Error if the object to parse is not a Request instance`, async () => {
      for (const value of [{}, 1, 'string', [], undefined, null]) {
        let error;

        try {
          // eslint-disable-next-line no-await-in-loop
          await RequestParser.parse(value);
        } catch (e) {
          error = e;
        }
        expect(error).to.be.instanceOf(Error);
      }
    });

    [
      ['https://ing.es?test=true', '/'],
      ['https://ing.es/sample', '/sample'],
      ['https://ing.es/sample/', '/sample/'],
      ['https://ing.es/sample/foo/bar', '/sample/foo/bar'],
    ].forEach(([url, pathname]) => {
      it(`should obtain the request path ${pathname} from ${url}`, async () => {
        const request = new Request(url);

        const { path } = await RequestParser.parse(request);

        expect(path).to.eq(pathname);
      });
    });

    ['GET', 'POST', 'PUT', 'PATCH', 'HEAD', 'DELETE', 'OPTIONS'].forEach((requestMethod) => {
      it(`should obtain the ${requestMethod} request method`, async () => {
        const request = new Request('https://ing.es', {
          method: requestMethod.toLowerCase(),
        });

        const { method } = await RequestParser.parse(request);

        expect(method).to.eq(requestMethod);
      });
    });

    [
      ['', undefined],
      ['?', undefined],
      [
        '?foo=bar&test=true',
        [
          ['foo', 'bar'],
          ['test', true],
        ],
      ],
    ].forEach(([query, entries]) => {
      it(`should obtain the request query params from ${query}`, async () => {
        const request = new Request(`https://ing.es${query}`);

        const { queryParams } = await RequestParser.parse(request);

        expect(isEqual(queryParams, new Map(entries))).to.be.true;
      });
    });

    [
      [{}, undefined],
      [
        {
          foo: 'bar',
          TEST: 'true',
        },
        [
          ['foo', 'bar'],
          ['test', 'true'],
        ],
      ],
    ].forEach(([requestHeaders, entries], index) => {
      it(`should obtain the request headers #${index}`, async () => {
        const request = new Request(`https://ing.es`, { headers: requestHeaders });

        const { headers } = await RequestParser.parse(request);

        expect(isEqual(headers, new Map(entries))).to.be.true;
      });
    });

    it(`should obtain the request JSON body`, async () => {
      const jsonBody = { name: 'test' };
      const textBody = JSON.stringify(jsonBody);
      const request = new Request(`https://ing.es`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        body: textBody,
      });

      const { body } = await RequestParser.parse(request);

      expect(body).to.eql(jsonBody);
    });

    it(`should obtain the request text body`, async () => {
      const textBody = '1';
      const request = new Request(`https://ing.es`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: textBody,
      });

      const { body } = await RequestParser.parse(request);

      expect(body).to.eq(textBody);
    });

    it(`should obtain the request form body`, async () => {
      const formData = new FormData();

      const request = new Request(`https://ing.es`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      request.formData = () => Promise.resolve(formData);

      const { body } = await RequestParser.parse(request);

      expect(body).to.eq(formData);
    });

    ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].forEach((method) => {
      it(`should not obtain the request body in case of a ${method} method`, async () => {
        const requestBody = 'OK';
        const request = new Request(`https://ing.es`, {
          method,
          headers: {
            'Content-Type': 'text/plain',
          },
          body: requestBody,
        });

        const { body } = await RequestParser.parse(request);

        expect(body).to.eq(requestBody);
      });
    });
  });
});
