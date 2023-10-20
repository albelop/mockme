import { expect } from '@esm-bundle/chai';

import { isContainedMap } from '../utils.js';

describe('utils', () => {
  describe('isContainedMap', () => {
    it(`should return true if both Maps are the same`, async () => {
      const map = new Map();

      expect(isContainedMap(map, map)).to.be.true;
    });

    it(`should return true if both Maps are empty`, async () => {
      expect(isContainedMap(new Map(), new Map())).to.be.true;
    });

    it(`should return true if first Map is empty`, async () => {
      expect(isContainedMap(new Map(), new Map([['1', 'one']]))).to.be.true;
    });

    it(`should return true if second Map contains the same entries than the first one`, async () => {
      expect(isContainedMap(new Map([['1', 'one']]), new Map([['1', 'one']]))).to.be.true;
    });

    it(`should return false if second Map not contains the same entries than the first one`, async () => {
      expect(isContainedMap(new Map([['1', 'one']]), new Map([['1', 1]]))).to.be.false;
    });

    it(`should return true if second Map contains the first one entries`, async () => {
      expect(
        isContainedMap(
          new Map([['1', 'one']]),
          new Map([
            ['1', 'one'],
            ['2', 'two'],
          ]),
        ),
      ).to.be.true;
    });

    it(`should return false if second Map not contains all the first one entries`, async () => {
      expect(
        isContainedMap(
          new Map([
            ['1', 'one'],
            ['2', 'two'],
          ]),
          new Map([
            ['1', 'one'],
            ['3', 'three'],
          ]),
        ),
      ).to.be.false;
    });
  });
});
