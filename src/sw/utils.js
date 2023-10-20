/**
 * Returns true if first Map is contained in the second one.
 *
 * @param {Map<string, any>} first
 * @param {Map<string, any>} second
 * @returns {boolean}
 */
export const isContainedMap = (first, second) => {
  if (first === second) {
    return true;
  }

  if (first.size <= second.size) {
    return Array.from(first.entries()).reduce(
      (acc, [key, value]) => acc && second.get(key) === value,
      true,
    );
  }

  return false;
};
