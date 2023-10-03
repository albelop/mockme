# mockme

A mock service worker generator to intercept fetch calls in the browser and return mocks defined in custom files.

This package will add a CLI to allow the creation of a service worker implementation that uses the result of parsing any kind of mock file. This will be done using a plugin system, where each plugin should be able to create the mocks needed for a specific style of mocking.

## Why mockme ?

There are some environments where you want to resolve your network (mainly API) calls, but you cannot reach the services or servers behind the scenes. Perhaps you need to benchmark the performance of your front-end solution, but you don't want the results to be affected by network response times, or you want to simulate what happens if a call takes 3 seconds to complete.

There are many scenarios where mocking responses using delays or different responses for different scenarios is a great tool to ensure you cover all edge cases. This is where **mockme** can help you.

## How to install

Install with NPM

```bash
$ npm i -D @betheweb/mockme
```

Install with Bun

```bash
$ bun add -D @betheweb/mockme
```

Install with PNPM

```bash
$ pnpm add -D @betheweb/mockme
```

## Configuration

The config file `mockme.config.mjs` should be placed in the root of your project. Here is an example:

```js
import mockmeJsPlugin from '@betheweb/mockme-js-plugin';

export default {
  output: 'demo/service-worker.js',
  plugins: [
    mockmeJsPlugin({
      // plugin config
    }),
  ],
};
```

If you need to have the different scenarios in your demo, you can generate an scenarios file that will have a default export with a list of strings for each one. To generate it include it in your config:

```js
import mockmeJsPlugin from '@betheweb/mockme-js-plugin';

export default {
  output: 'demo/service-worker.js',
  scenarios: {
    output: 'demo/scenarios.js',
  },
};
```

## Plugins

A mockme plugin is an object with name property, and a handler function to generate the output as described below, and which follows our conventions.
A plugin should be distributed as a package that exports a function that can be called with plugin-specific options and returns such an object.

### Conventions

- Plugins should have type module.
- Plugins should have a clear name with `mockme-plugin-` prefix.
- Include `mockme-plugin` keyword in `package.json`.
- Plugins should be tested. We recommend mocha or vitest.
- Use asynchronous methods when it is possible, e.g. `fs.readFile` instead of `fs.readFileSync`.
- Document your plugin in English.

### Properties

#### name : `string`

The name of the plugin to be used when logging.

#### handler : `function(logger?: Logger): Promise<MockSchema[]>|MockSchema[]`

The function which is going to use the config to generate the output.

```js
export function plugin(config) {
  return {
    name: 'mockme-plugin-test',
    handler: () => [], // Returns an array of objects that have a mock schema
  };
}
```

## Mock Schema

All plugins should return an array of objects that should be validated using the Mock Schema. This is the definition for the schema:

```js
{
  request: {
    method: "GET"|"POST"|"PUT"|"HEAD"|"DELETE"|"OPTIONS"|"CONNECT",
    path: string,
    body: object, // Optional
    conditions: { // optional
      body: object, // Optional
      cookie: object, // Optional
      header: object, // Optional
      query: object, // Optional
      url: object, // Optional
    },
  },
  response: function || {
    body: object, // Optional, default to empty object.
    headers: object, // Optional
    status: number, // Optional, default to 200.
    delay: number, // Optional, default to 0.
  },
  delay: number, // Optional, default to 0.
  scenario: string, // Optional.
}
```

### request.method

HTTP Verb used in the request. It is **required** and must have a value of `GET`,`POST`,`PUT`,`HEAD`,`DELETE`,`OPTIONS` or `CONNECT`.

### request.path

Pathname of the request. It is **required** accepts segments like express routes.

Example:

```js
{
  request: {
    method: 'GET',
    path: '/api/v1/books/:id',
  }
}
```

### request.body

The body of the HTTP request. It is optional and should match

Example:

```js
{
  request: {
    method: 'POST',
    path: '/api/v1/books',
    body: {
      title: 'Harry Potter',
    }
  }
}
```

### request.conditions

This object contains all the conditions to match against the request to find the proper mock to return.

#### request.conditions.body

This object defines the conditions to match against url parameters. It is optional.

Example:

```js
{
  request: {
    method: 'GET',
    path: '/api/v1/books/:id',
    conditions: {
      body: {
        id: "1", // This ensures the url is /api/v1/books/1
      }
    }
  }
}
```

#### request.conditions.cookie

This object defines the conditions to match against the cookies included in the request. It is optional.

Example:

```js
{
  request: {
    method: 'GET',
    path: '/api/v1/books/:id',
    conditions: {
      cookie: {
        user: "1" // This ensures the request includes a cookie with name user and value "1"
      }
    }
  }
}
```

#### request.conditions.header

This object defines the conditions to match against the headers included in the request. It is optional.

Example:

```js
{
  request: {
    method: 'GET',
    path: '/api/v1/books/:id',
    conditions: {
      header: {
        "Content-Type": "application/json" // This ensures the request includes a header with name Content-Type and value "application/json"
      }
    }
  }
}
```

#### request.conditions.query

This object defines the conditions to match against url query parameters. It is optional.

Example:

```js
{
  request: {
    method: 'GET',
    path: '/api/v1/books?page=1',
    conditions: {
      query: {
        page: "1" // The url should have a query parameter with name page and value "1"
      }
    }
  }
}
```

#### request.conditions.url

This object defines the conditions to match against url parameters. It is optional.

Example:

```js
{
  request: {
    method: 'GET',
    path: '/api/v1/books/:id',
    conditions: {
      url: {
        id: "1" // This ensures the url is /api/v1/books/1
      }
    }
  }
}
```

All conditions are checked against the request and should pass. If there is a mismatch, no mock will be returned and the request will be passed to the network.

Here is a complex example where all conditions are combined:

```js
{
  request: {
    method: 'PUT',
    path: '/api/v1/books/:id?pages=100'
    conditions: {
      body: { role: "admin", title: "Harry Potter" },
      cookie: { token: "12345" },
      header: { "Authorization": "Bearer abcd" },
      query: { pages: "100" },
      url: { id: "1" },
    }
  }
}
```

To the service worker to match a request and return a mock data for it, the request should be like this:

```js
const myHeaders = new Headers();
myHeaders.append('Content-Type', 'application/json');
myHeaders.append('Authorization', 'Bearer abcd');
myHeaders.append('Cookie', 'token=12345');

const raw = JSON.stringify({
  role: 'admin',
  title: 'Harry Potter',
});

const requestOptions = {
  method: 'GET',
  headers: myHeaders,
  body: raw,
};

async function updateBook() {
  try {
    const response = await fetch('http://test.com/api/v1/books/1?pages=100', requestOptions);
    const result = await response.json();
  } catch (error) {
    console.log(error);
  }
}
```

### response

The response can be either a function or an object. In case you need to perform any logic before returning the response, you may use a function which will receive an object with url, query, body, header and cookie keys from the request.

Example:

```js
{
  response: ({url, query, body, header, cookie}) => {
    if(url.id === "1") {
      return {
        body: {
          message: "Book updated",
        }
        status: 200,
        delay: 3000,
      }
    } else {
      return {
        body: { message: "Book not found" },
        status: 404,
      }
    }
  }
}
```

### response.body

The body to include in the response. This is optional and it is set to an empty object if not present.

Example:

```js
{
  response: {
    body: {
      title: "Harry Potter",
      id: "1",
    }
  }
}
```

### response.headers

The headers to include in the response. This is optional.

```js
{
  response: {
    headers: {
      "Content-Type": "application/json"
    }
  }
}
```

### response.status

The status of the response. This is optional and default value is `200`.

```js
{
  response: {
    status: 404,
  }
}
```

### delay

This will set the response to be delayed by the number of milliseconds specified. This is optional and default value is 0. If the response is set as a function and it returns a value for delay, it will take precendence over this one.

### scenario

The scenario the mock is going to be in. This is optional.
When using the service worker generated with mockme, the scenario can be set so we can have multiple mocks for the same endpoint but for different scenarios.

Example :

```js
[
  {
    request: {
      method: "GET",
      path: "/api/v1/books",
    },
    response: {
      body: [{ id: "1", title: "Harry Potter" }],
    },
  },
  {
    request: {
      method: "GET",
      path: "/api/v1/books",
    },
    response: {
      body: [
        { id: "1", title: "Harry Potter: Philosopher's stone" },
        { id: "2", title: "Harry Potter: Chamber of secrets" },
        { id: "3", title: "Harry Potter: Prisoner of Azkaban" },
        ...
        ],
    },
    scenario: '3 books'
  },
];
```

If no scenario is set, the response will include one item, but if the scenario is set to `'3 books'`, the response will include 3 items in the body.
