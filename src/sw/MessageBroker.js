const BROADCAST_CHANNEL_ID = 'mockme';

const messages = Object.fromEntries(
  [
    'enable-scenario',
    'disable-scenario',
    'set-cookie',
    'remove-cookie',
    'ask-for-config',
    'send-config',
  ].map((name) => [name.toUpperCase().replaceAll('-', '_'), name]),
);

export class MessageBroker {
  /** @type {BroadcastChannel} */
  #broadcastChannel;

  /** @type {Record<string, Array<(any) => {}>>} */
  #subscribers;

  constructor({ broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_ID) } = {}) {
    this.#broadcastChannel = broadcastChannel;
    this.#subscribers = Object.fromEntries(Object.values(messages).map((message) => [message, []]));
    this.#broadcastChannel.onmessage = (event) => this.#onmessage(event.data);
  }

  #onmessage({ type = 'UNKNOWN', ...data } = {}) {
    const subscribers = this.#subscribers[type] ?? [];

    subscribers.forEach((subscriber) => subscriber(data));
  }

  /**
   * Closes the connection with the message broker.
   */
  close() {
    this.#broadcastChannel.close();
  }

  /**
   * Sends a message to enable a scenario.
   *
   * @param {string} scenario
   */
  enableScenario(scenario) {
    this.#broadcastChannel.postMessage({
      type: messages.ENABLE_SCENARIO,
      scenario,
    });
  }

  /**
   * Adds a new listener to enable scenario messages.
   *
   * @param {({ scenario: string }) => {}} listener
   */
  addEnableScenarioListener(listener) {
    this.#subscribers[messages.ENABLE_SCENARIO].push(listener);
  }

  /**
   * Sends a message to disable a scenario.
   *
   * @param {string} scenario
   */
  disableScenario(scenario) {
    this.#broadcastChannel.postMessage({
      type: messages.DISABLE_SCENARIO,
      scenario,
    });
  }

  /**
   * Adds a new listener to disable scenario messages.
   *
   * @param {({ scenario: string }) => {}} listener
   */
  addDisableScenarioListener(listener) {
    this.#subscribers[messages.DISABLE_SCENARIO].push(listener);
  }

  /**
   * Sends a message to set a cookie value.
   *
   * @param {string} name
   * @param {string} value
   */
  setCookie(name, value) {
    this.#broadcastChannel.postMessage({
      type: messages.SET_COOKIE,
      name,
      value,
    });
  }

  /**
   * Adds a new listener to set cookie messages.
   *
   * @param {({ name: string, value: string }) => {}} listener
   */
  addSetCookieListener(listener) {
    this.#subscribers[messages.SET_COOKIE].push(listener);
  }

  /**
   * Sends a message to remove a cookie.
   *
   * @param {string} name
   */
  removeCookie(name) {
    this.#broadcastChannel.postMessage({
      type: messages.REMOVE_COOKIE,
      name,
    });
  }

  /**
   * Adds a new listener to remove cookie messages.
   *
   * @param {({ name: string }) => {}} listener
   */
  addRemoveCookieListener(listener) {
    this.#subscribers[messages.REMOVE_COOKIE].push(listener);
  }

  /**
   * Sends a message to ask for the service-worker config.
   */
  askForConfig() {
    this.#broadcastChannel.postMessage({ type: messages.ASK_FOR_CONFIG });
  }

  /**
   * Adds a new listener to ask for service-worker config messages.
   *
   * @param {({ name: string }) => {}} listener
   */
  addAskForConfigListener(listener) {
    this.#subscribers[messages.ASK_FOR_CONFIG].push(listener);
  }

  /**
   * Sends a message with the service-worker config.
   *
   * @param {any} config
   */
  sendConfig(config) {
    this.#broadcastChannel.postMessage({ type: messages.SEND_CONFIG, config });
  }

  /**
   * Adds a new listener to service-worker config messages.
   *
   * @param {({ config: any }) => {}} listener
   */
  addSendConfigListener(listener) {
    this.#subscribers[messages.SEND_CONFIG].push(listener);
  }
}
