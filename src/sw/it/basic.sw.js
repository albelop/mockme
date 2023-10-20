import { sw } from '../index.js';

// eslint-disable-next-line no-restricted-globals
sw(self, [
  {
    request: {
      method: 'GET',
      path: '/src/sw/it/test',
    },
    response: {
      status: 200,
      body: { message: 'ok' },
    },
  },
]);
