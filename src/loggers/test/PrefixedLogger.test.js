import {describe, expect, it, vi} from "vitest";

import {PrefixedLogger} from "../PrefixedLogger.js";

describe('PrefixedLogger', () => {
    it("should create an instance", () => {
        expect(new PrefixedLogger()).toBeInstanceOf(PrefixedLogger);
    });

    ['log', 'warn', 'error'].forEach(method => {
        it(`should call logger.${method} prefixing the message`, () => {
            const decorated ={ [method]: vi.fn() };
            const prefix = "[prefix]";
            const logger = new PrefixedLogger({
                logger: decorated,
                prefix,
            });
            const message = "message";

            logger[method](message);

            expect(decorated[method]).toBeCalledWith(`${prefix} ${message}`);
        });
    });
});