import {describe, expect, it, vi} from "vitest";
import {WritableStream} from "memory-streams";
import nodeConsole from "node:console";

import { ConsoleFactory } from "../ConsoleFactory.js";

describe('ConsoleFactory', () => {
    describe('static get', () => {
        it(`should return the standard console when no output directory is specified`, async () => {
            const console = ConsoleFactory.get();

            expect(console).to.be.eql(nodeConsole);
        });

        it(`should create a new console instance if output directory is specified`, async () => {
            const stream = new WritableStream();

            const console = ConsoleFactory.get({
                    outputDirectory: './outputs/',
                },
                {
                    createDirectory: vi.fn(),
                    createStream: () => stream,
                });

            expect(console).to.not.be.eql(nodeConsole);
        });

        it(`should call createDirectory to create the output directory`, async () => {
            const stream = new WritableStream();
            const createDirectory = vi.fn();
            const outputDirectory = './outputs/';

            ConsoleFactory.get({
                    outputDirectory,
                },
                {
                    createDirectory,
                    createStream: () => stream,
                });

            expect(createDirectory).toBeCalledWith(outputDirectory);
        });

        it(`should create the output and error streams`, async () => {
            const stream = new WritableStream();
            const createStream = vi.fn();
            const outputDirectory = '/outputs/';

            createStream.mockReturnValue(stream);

            ConsoleFactory.get({
                    outputDirectory,
                },
                {
                    createDirectory: vi.fn(),
                    createStream,
                });

            ['out', 'err'].forEach((value, index) => {
                expect(createStream.mock.calls[index]).to
                    .match(new RegExp(`${outputDirectory}\\d{4}-\\d{1,2}-\\d{1,2}\\.${value}\\.log`));
            });
        });
    });
});