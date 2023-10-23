/**
 * Gets the current base url for the host formed by protocol, hostname and port
 * @returns {String}
 */
export function getCurrentBaseUrl() {
  return `${globalThis.location.protocol}//${globalThis.location.hostname}${
    globalThis.location.port ? `:${globalThis.location.port}` : ''
  }`;
}

/**
 *
 * @param {Request|URL|String} input
 * @returns {URL}
 */
export function getUrl(input) {
  if (input instanceof URL) return input;
  if (input instanceof Request) {
    return new URL(input.url);
  }
  if (input.indexOf('://') !== -1) {
    return new URL(input);
  }

  return new URL(input, getCurrentBaseUrl());
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
export function replaceUrl(requestUrl, origin) {
  const { hostname, port, protocol } = getUrl(requestUrl);

  const requestHost = formatUrl({ hostname, port, protocol });
  const originHost = origin || getCurrentBaseUrl();

  return { destinationURL: requestUrl.toString().replace(requestHost, originHost), requestHost };
}
