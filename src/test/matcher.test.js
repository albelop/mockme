import { describe, it, expect, vi } from "vitest";
import Matcher from "../matcher";

describe("Matcher", () => {
  it("should be constructable", () => {
    expect(new Matcher()).toBeInstanceOf(Matcher);
  });

  it("should validate mocks is an array", () => {
    // @ts-ignore
    expect(() => new Matcher({})).toThrowError(
      "Matcher expects an array of objects within a mock shape."
    );
  });

  it("should parse and validate the schema of the mocks", () => {
    expect(
      () =>
        new Matcher([
          {
            name: "value",
          },
        ])
    ).toThrowError("Matcher expects an array of objects within a mock shape.");
  });

  it("should accept an array of mocks", () => {
    const matcher = new Matcher([
      {
        request: { method: "GET", path: "/" },
        response: { status: 200, body: {} },
      },
    ]);
    expect(matcher).toBeInstanceOf(Matcher);
  });

  it("should return the list of scenarios", () => {
    const matcher = new Matcher([
      {
        request: {
          method: "GET",
          path: "/test",
        },
        response: {
          body: { scenario: "a" },
        },
        scenario: "a",
      },
      {
        request: {
          method: "GET",
          path: "/test",
        },
        response: {
          body: { scenario: "b" },
        },
        scenario: "b",
      },
    ]);

    expect(matcher.scenarios).toStrictEqual(["a", "b"]);
  });

  it("should return the list of paths", () => {
    const matcher = new Matcher([
      {
        request: {
          method: "GET",
          path: "/test-a",
        },
      },
      {
        request: {
          method: "GET",
          path: "/test-b",
        },
      },
    ]);

    expect(matcher.paths).toStrictEqual(["/test-a", "/test-b"]);
  });

  describe("match", () => {
    it("should return an error response if no match", async () => {
      const matcher = new Matcher([
        {
          request: { method: "GET", path: "/" },
          response: { status: 200, body: {} },
        },
      ]);

      const { response } = await matcher.match({
        method: "POST",
        path: "/abc",
      });
      expect(response).toHaveProperty("status", 0);
    });

    it("should match a mock by method and path", async () => {
      const matcher = new Matcher([
        {
          request: { method: "GET", path: "/" },
          response: { status: 200, body: {} },
        },
      ]);

      const { response } = await matcher.match({ method: "GET", path: "/" });

      expect(response).toBeInstanceOf(Response);
    });

    it("should match a mock by method, path and header", async () => {
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/",
            conditions: { header: { a: 1 } },
          },
          response: { status: 200, body: {} },
        },
      ]);

      const { response } = await matcher.match({
        method: "GET",
        path: "/",
        header: { a: "1" },
      });

      expect(response).toHaveProperty("status", 200);
    });

    it("should match a mock by method, path, header and url", async () => {
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/:id",
            conditions: { header: { a: 1 } },
          },
          response: { status: 200, body: {} },
        },
      ]);

      const { response } = await matcher.match({
        method: "GET",
        path: "/1",
        header: { a: "1" },
      });

      expect(response).toHaveProperty("status", 200);
    });

    it("should match a mock by method, path and cookie", async () => {
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/",
            conditions: { cookie: { a: 1 } },
          },
          response: { status: 200, body: {} },
        },
      ]);

      const { response } = await matcher.match({
        method: "GET",
        path: "/",
        cookie: "a=1",
      });

      expect(response).toHaveProperty("status", 200);
    });

    it("should match a mock by method, path, headers, cookie, url, query, queryParam, param and body", async () => {
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/:id",
            conditions: {
              header: { a: 1 },
              body: { b: 2 },
              query: { c: 3 },
              param: { d: 4 },
              cookie: { f: 6 },
            },
          },
          response: { status: 200, body: {} },
        },
      ]);

      const { response } = await matcher.match({
        method: "GET",
        path: "/1",
        header: { a: "1" },
        url: { id: 1 },
        body: { b: 2 },
        query: { c: 3 },
        cookie: "f=6",
      });

      expect(response).toHaveProperty("status", 200);
    });

    it("should match by scenario", async () => {
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/test",
          },
          response: {
            body: { scenario: "a" },
          },
          scenario: "a",
        },
        {
          request: {
            method: "GET",
            path: "/test",
          },
          response: {
            body: { scenario: "b" },
          },
          scenario: "b",
        },
      ]);

      matcher.scenario = "b";

      const { response } = await matcher.match({
        method: "GET",
        path: "/test",
      });

      const body = await response.json();

      expect(body).toStrictEqual({ scenario: "b" });
    });

    it("should match default if no mock set for specific scenario", async () => {
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/test",
          },
          response: {
            body: { scenario: "no scenario" },
          },
        },
        {
          request: {
            method: "GET",
            path: "/test",
          },
          response: {
            body: { scenario: "b" },
          },
          scenario: "b",
        },
      ]);

      const { response } = await matcher.match({
        method: "GET",
        path: "/test",
      });

      const body = await response.json();

      expect(body).toStrictEqual({ scenario: "no scenario" });
    });

    it("should return a delayed response", async () => {
      const delay = 200;
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/test",
          },
          delay,
        },
      ]);

      const { delayedResponse } = await matcher.match({
        method: "GET",
        path: "/test",
      });

      performance.mark("delay-start");
      await delayedResponse();
      performance.mark("delay-end");
      const perf = performance.measure("delay", "delay-start", "delay-end");

      expect(perf.duration).toBeGreaterThan(delay);
    });

    it("should throw if scenario is not valid", () => {
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/test",
          },
          scenario: "a",
        },
      ]);

      expect(() => {
        matcher.scenario = "b";
      }).toThrow(
        "Scenario b is not a valid one. Valid scenario options are a."
      );
    });

    it("can be called with a Request instance", async () => {
      const body = { a: 1 };
      const matcher = new Matcher([
        {
          request: {
            method: "GET",
            path: "/test",
          },
          response: {
            body,
          },
        },
      ]);

      const { response } = await matcher.match(
        new Request("http:/test.com/test")
      );
      const result = await response.json();
      expect(result).toEqual(body);
    });
  });

  describe("response", () => {
    it("should call response fn with request path params", async () => {
      const responseFn = vi.fn().mockReturnValue({ body: {}, status: 200 });
      const matcher = new Matcher([
        {
          request: { method: "GET", path: "/:id" },
          response: responseFn,
          delay: 3000,
        },
      ]);

      await matcher.match({ method: "GET", path: "/1" });
      expect(responseFn).toHaveBeenCalledWith({ url: { id: "1" } });
    });

    it("should call response fn with request body", async () => {
      const responseFn = vi.fn().mockReturnValue({ body: {}, status: 200 });
      const matcher = new Matcher([
        {
          request: { method: "PUT", path: "/:id" },
          response: responseFn,
        },
      ]);
      const requestBody = { b: "1" };
      const request = new Request("http://localhost/1", {
        body: JSON.stringify(requestBody),
        method: "PUT",
      });

      await matcher.match(request);
      expect(responseFn).toHaveBeenCalledWith({
        body: requestBody,
        url: { id: "1" },
        header: { "content-type": "text/plain;charset=UTF-8" },
      });
    });

    it("should call response fn with request body", async () => {
      const responseFn = vi.fn().mockReturnValue({ body: {}, status: 200 });
      const matcher = new Matcher([
        {
          request: { method: "PUT", path: "/:id" },
          response: responseFn,
        },
      ]);
      const requestBody = { b: "1" };
      const requestHeaders = new Headers();
      requestHeaders.append("h", "3");
      const request = new Request("http://localhost/1", {
        body: JSON.stringify(requestBody),
        method: "PUT",
        headers: requestHeaders,
      });

      await matcher.match(request);
      expect(responseFn).toHaveBeenCalledWith({
        body: requestBody,
        url: { id: "1" },
        header: {
          ...Object.fromEntries(requestHeaders),
          "content-type": "text/plain;charset=UTF-8",
        },
      });
    });
  });
});
