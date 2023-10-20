/**
 * Evaluates a predicate and if is successful then executes the func.
 *
 * @param predicate
 * @param func
 * @returns {*[]}
 */
export const when = (predicate, func) => (predicate ? func() : []);

/**
 * Checks if a name is an environment flag argument.
 *
 * @param name
 * @returns {boolean}
 */
export const arg = (name) => process.argv.includes(`--${name}`);
