import {
  describe, expect, it, vi,
} from 'vitest';

import { Logger } from '../Logger.js';

describe('Logger', () => {
  it('should create an instance', () => {
    expect(new Logger()).toBeInstanceOf(Logger);
  });

  ['log', 'warn', 'error'].forEach((method) => {
    it(`should call console.${method} with the message`, () => {
      const consoleMock = { [method]: vi.fn() };
      const logger = new Logger(consoleMock);
      const message = 'message';

      logger[method](message);

      expect(consoleMock[method]).toBeCalledWith(`[${method.toUpperCase()}] ${message}`);
    });
  });
});
