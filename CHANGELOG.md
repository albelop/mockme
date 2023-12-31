# @betheweb/mockme

## 0.3.1

### Patch Changes

- eefe109: Fix config file import on windows file system
- 1637a2a: Same scenario in multiple mocks is only listed once in the scenarios output

## 0.3.0

### Minor Changes

- 08ff8f9: New ServiceWorkerManager to handle service worker registration. Use ServiceWorkerManager.register() to do the setup.
- 8a7a7ac: Enable change of scenario through the ServiceWorkerManager

### Patch Changes

- b8a5e51: match response should be in the respondWith promise

## 0.2.1

### Patch Changes

- 195c4d9: support PATCH HTTP verb

## 0.2.0

### Minor Changes

- 8632a89: - Include scenarios file genearation from mocks using scenarios.ouput in config.
  - Check header condition by intersection of two objects.
  - Use cookie-muncher instead of cookie package.
- 7cfdbb4: Mock response: when it is a function it should receive the request body and params as parameters to generate a proper response.

### Patch Changes

- a4df66b: Pass a custom logger to every plugin in the handler call.
  Add matcher.match in the promise chain returned by the fetch handler in the service worker.

## 0.1.0

### Minor Changes

- a56767e: Initial release

## 0.0.3

### Patch Changes

- 3ac9aaf: Add documentation on how to use it and how it works.
- 2112be4: extract the CLI command to a new file and only run it in the main bin file. This way, we can test it.
