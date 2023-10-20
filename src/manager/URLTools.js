/**
 *
 * @param {Request|URL|String} input
 * @returns {URL}
 */
export function getUrl(input) {
  if (input instanceof Request) {
    return new URL(input.url);
  }

  return new URL(input);
}

/**
 * Gets the current base url for the host formed by protocol, hostname and port
 * @returns {String}
 */
export function getCurrentBaseUrl({
  url: { protocol, hostname, port } = globalThis.location,
} = {}) {
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}

/**
 *
 * @param {Object} options
 * @param {String} options.protocol
 * @param {String} options.hostname
 * @param {String} [options.port]
 * @returns
 */
export function formatUrl({ protocol, hostname, port }) {
  return `${protocol.replace(':', '')}://${hostname}${port ? `:${port}` : ''}`;
}

/**
 * @typedef {Object} UrlReplacement
 * @property {string} destinationURL - The url of the request with the host replaced
 * @property {string} requestHost - The original host of the request
 */

/**
 *
 * @param {String|URL} requestUrl
 * @param {String} [origin]
 * @returns {UrlReplacement}
 */
export function replaceUrl(requestUrl, origin, { url } = {}) {
  const { hostname, port, protocol } = getUrl(requestUrl);

  const requestHost = formatUrl({ hostname, port, protocol });
  const originHost = origin || getCurrentBaseUrl({ url });

  return { destinationURL: requestUrl.toString().replace(requestHost, originHost), requestHost };
}
