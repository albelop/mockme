import { expect } from '@esm-bundle/chai';

import { Matcher } from '../Matcher.js';

describe('Matcher', () => {
  it('should be constructable', () => {
    expect(new Matcher()).to.be.instanceOf(Matcher);
  });

  it('should validate mocks is an array', () => {
    // @ts-ignore
    expect(() => new Matcher({})).to.throw(
      'Matcher expects an array of objects within a mock shape.',
    );
  });

  it('should parse and validate the schema of the mocks', () => {
    expect(
      () =>
        new Matcher([
          {
            name: 'value',
          },
        ]),
    ).to.throw('Matcher expects an array of objects within a mock shape.');
  });

  it('should accept an array of mocks', () => {
    const matcher = new Matcher([
      {
        request: { method: 'GET', path: '/' },
        response: { status: 200, body: {} },
      },
    ]);

    expect(matcher).to.be.instanceOf(Matcher);
  });

  it('should return the map of scenarios', () => {
    const matcher = new Matcher([
      {
        request: {
          method: 'GET',
          path: '/test',
        },
        response: {
          status: 200,
          body: { scenario: 'a' },
        },
        scenario: 'a',
      },
      {
        request: {
          method: 'GET',
          path: '/test',
        },
        response: {
          status: 200,
          body: { scenario: 'b' },
        },
        scenario: 'b',
      },
    ]);

    expect([...matcher.scenarios.keys()]).to.be.eql(['a', 'b']);
  });

  describe('match', () => {
    it('should return undefined if no match', async () => {
      const matcher = new Matcher([
        {
          request: { method: 'GET', path: '/' },
          response: { status: 200, body: {} },
        },
      ]);

      const request = new Request('https:/example.com/abc', {
        method: 'POST',
      });

      const mock = await matcher.match(request);

      expect(mock).to.be.undefined;
    });

    it('should match a mock by method and path', async () => {
      const matcher = new Matcher([
        {
          request: { method: 'GET', path: '/' },
          response: { status: 200, body: {} },
        },
      ]);

      const mock = await matcher.match(new Request('https://example.com', { method: 'GET' }));

      expect(mock).not.to.be.undefined;
    });

    it('should match a mock by method, path and header', async () => {
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/',
            conditions: { header: { a: 1 } },
          },
          response: { status: 200, body: {} },
        },
      ]);
      const mock = await matcher.match(
        new Request('https://example.com', {
          method: 'GET',
          headers: { a: 1 },
        }),
      );

      const response = await mock.getResponse();

      expect(response).to.have.property('status', 200);
    });

    it('should match a mock by method, path, header and url', async () => {
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/:id',
            conditions: { header: { a: 1 } },
          },
          response: { status: 200, body: {} },
        },
      ]);
      const mock = await matcher.match(
        new Request('https://example.com/1', {
          method: 'GET',
          headers: { a: 1 },
        }),
      );

      const response = await mock.getResponse();

      expect(response).to.have.property('status', 200);
    });

    it('should match a mock by method, path and cookie', async () => {
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/',
            conditions: { cookie: { a: 1 } },
          },
          response: { status: 200, body: {} },
        },
      ]);

      matcher.setCookie('a', '1');

      const mock = await matcher.match(
        new Request('https://example.com', {
          method: 'GET',
        }),
      );

      const response = await mock.getResponse();

      expect(response).to.have.property('status', 200);
    });

    it('should match a mock by method, path, headers, cookie, url, query, queryParam, param and body', async () => {
      const matcher = new Matcher([
        {
          request: {
            method: 'POST',
            path: '/:id',
            body: { b: 2 },
            conditions: {
              header: { a: 1 },
              query: { c: 3 },
              cookie: { f: 6 },
            },
          },
          response: { status: 200, body: {} },
        },
      ]);

      matcher.setCookie('f', '6');

      const body = JSON.stringify({ b: 2 });

      const mock = await matcher.match(
        new Request('https://example.com/1?c=3', {
          method: 'POST',
          headers: {
            a: '1',
            'Content-Length': body.length,
            'Content-Type': 'application/json',
          },
          body,
        }),
      );

      const response = await mock.getResponse();

      expect(response).to.have.property('status', 200);
    });

    it('should match by scenario', async () => {
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/test',
          },
          response: {
            status: 200,
            body: { scenario: 'a' },
          },
          scenario: 'a',
        },
        {
          request: {
            method: 'GET',
            path: '/test',
          },
          response: {
            status: 200,
            body: { scenario: 'b' },
          },
          scenario: 'b',
        },
      ]);

      matcher.enableScenario('b');

      const mock = await matcher.match(
        new Request('https://example.com/test', {
          method: 'GET',
        }),
      );

      const response = await mock.getResponse();
      const body = await response.json();

      expect(body).to.be.eql({ scenario: 'b' });
    });

    it('should match default if no mock set for specific scenario', async () => {
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/test',
          },
          response: {
            status: 200,
            body: { scenario: 'no scenario' },
          },
        },
        {
          request: {
            method: 'GET',
            path: '/test',
          },
          response: {
            status: 200,
            body: { scenario: 'b' },
          },
          scenario: 'b',
        },
      ]);

      const mock = await matcher.match(
        new Request('https://example.com/test', {
          method: 'GET',
        }),
      );
      const response = await mock.getResponse();

      const body = await response.json();

      expect(body).to.be.eql({ scenario: 'no scenario' });
    });

    it('should return a delayed response', async () => {
      const delay = 200;
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/test',
          },
          response: {
            status: 200,
            body: {},
          },
          delay,
        },
      ]);

      const mock = await matcher.match(
        new Request('https://example.com/test', {
          method: 'GET',
        }),
      );

      performance.mark('delay-start');
      await mock.getResponse();
      performance.mark('delay-end');

      const perf = performance.measure('delay', 'delay-start', 'delay-end');

      expect(Math.round(perf.duration) >= delay).to.be.true;
    });

    it('should throw if scenario is not valid', () => {
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/test',
          },
          response: {
            status: 200,
            body: {},
          },
          scenario: 'a',
        },
      ]);

      expect(() => {
        matcher.enableScenario('b');
      }).to.throw('The specified scenario b is not used by the loaded mocks.');
    });

    it('can be called with a Request instance', async () => {
      const body = { a: 1 };
      const matcher = new Matcher([
        {
          request: {
            method: 'GET',
            path: '/test',
          },
          response: {
            status: 200,
            body,
          },
        },
      ]);

      const mock = await matcher.match(new Request('https://test.com/test'));
      const response = await mock.getResponse();
      const result = await response.json();

      expect(result).to.eql(body);
    });
  });

  // describe('response', () => {
  //   it('should call response fn with request path params', async () => {
  //     const responseFn = vi.fn().mockReturnValue({ body: {}, status: 200 });
  //     const matcher = new Matcher([
  //       {
  //         request: { method: 'GET', path: '/:id' },
  //         response: responseFn,
  //         delay: 3000,
  //       },
  //     ]);
  //
  //     await matcher.match({ method: 'GET', path: '/1' });
  //
  //     expect(responseFn).toHaveBeenCalledWith({ url: { id: '1' } });
  //   });
  //
  //   it('should call response fn with request body', async () => {
  //     const responseFn = vi.fn().mockReturnValue({ body: {}, status: 200 });
  //     const matcher = new Matcher([
  //       {
  //         request: { method: 'PUT', path: '/:id' },
  //         response: responseFn,
  //       },
  //     ]);
  //     const requestBody = { b: '1' };
  //     const request = new Request('http://localhost/1', {
  //       body: JSON.stringify(requestBody),
  //       method: 'PUT',
  //     });
  //
  //     await matcher.match(request);
  //
  //     expect(responseFn).toHaveBeenCalledWith({
  //       body: requestBody,
  //       url: { id: '1' },
  //       header: { 'content-type': 'text/plain;charset=UTF-8' },
  //     });
  //   });
  //
  //   it('should call response fn with request body', async () => {
  //     const responseFn = vi.fn().mockReturnValue({ body: {}, status: 200 });
  //     const matcher = new Matcher([
  //       {
  //         request: { method: 'PUT', path: '/:id' },
  //         response: responseFn,
  //       },
  //     ]);
  //     const requestBody = { b: '1' };
  //     const requestHeaders = new Headers();
  //     requestHeaders.append('h', '3');
  //     const request = new Request('http://localhost/1', {
  //       body: JSON.stringify(requestBody),
  //       method: 'PUT',
  //       headers: requestHeaders,
  //     });
  //
  //     await matcher.match(request);
  //
  //     expect(responseFn).toHaveBeenCalledWith({
  //       body: requestBody,
  //       url: { id: '1' },
  //       header: {
  //         ...Object.fromEntries(requestHeaders),
  //         'content-type': 'text/plain;charset=UTF-8',
  //       },
  //     });
  //   });
  // });
});
