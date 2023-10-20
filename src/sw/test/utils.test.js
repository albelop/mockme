import { describe, expect, it } from 'vitest';

import { areEqualMaps, isContainedMap } from '../utils.js';

describe('utils', () => {
  describe('areEqualMaps', () => {
    it('should return true if Maps are the same reference', async () => {
      const map = new Map();

      expect(areEqualMaps(map, map)).to.be.true;
    });

    it(`should return true if both Maps are empty`, async () => {
      expect(areEqualMaps(new Map(), new Map())).to.be.true;
    });

    it(`should return false if Maps length are different`, async () => {
      expect(areEqualMaps(new Map([['1', true]]), new Map())).to.be.false;
    });

    it(`should return true if both Maps contains the same entries`, async () => {
      expect(areEqualMaps(new Map([['1', true]]), new Map([['1', true]]))).to.be.true;
    });

    it(`should return false if both Maps contains the same key but different content`, async () => {
      expect(areEqualMaps(new Map([['1', 'one']]), new Map([['1', 1]]))).to.be.false;
    });

    it(`should return false if both Maps contains different number of entries`, async () => {
      expect(
        areEqualMaps(
          new Map([['1', 'one']]),
          new Map([
            ['1', 'one'],
            ['2', 'two'],
          ]),
        ),
      ).to.be.false;
    });
  });

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
