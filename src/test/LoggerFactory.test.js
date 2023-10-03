import {describe, expect, it} from "vitest";

import { LoggerFactory } from "../LoggerFactory.js";
import {Logger} from "../loggers/Logger.js";
import {PrefixedLogger} from "../loggers/PrefixedLogger.js";

describe('LoggerFactory', () => {
    describe('static get', () => {
        it(`should create a Logger if not prefix is specified`, async () => {
            const logger = LoggerFactory.get();

            expect(logger).to.be.instanceOf(Logger);
        });

        it(`should create a PrefixedLogger if prefix is specified`, async () => {
            const logger = LoggerFactory.get({ prefix: 'test'});

            expect(logger).to.be.instanceOf(PrefixedLogger);
        });
    });
});